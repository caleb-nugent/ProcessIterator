import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultUserId } from "@/lib/defaultUser";

export async function GET() {
  const userId = await getDefaultUserId();
  const entries = await prisma.lifeEntry.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: 100,
  });
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const userId = await getDefaultUserId();
  const { label, startedAt, stoppedAt } = await req.json();
  const entry = await prisma.lifeEntry.create({
    data: {
      userId,
      label,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      stoppedAt: stoppedAt ? new Date(stoppedAt) : null,
    },
  });
  return NextResponse.json(entry);
}
