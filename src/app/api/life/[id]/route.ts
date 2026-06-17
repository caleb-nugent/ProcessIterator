import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entry = await prisma.lifeEntry.update({
    where: { id },
    data: { stoppedAt: new Date() },
  });
  return NextResponse.json(entry);
}
