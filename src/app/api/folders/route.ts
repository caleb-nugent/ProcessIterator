import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultUserId } from "@/lib/defaultUser";

export async function GET() {
  const folders = await prisma.folder.findMany({
    include: {
      _count: { select: { processes: true } },
      children: {
        include: { _count: { select: { processes: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(folders);
}

export async function POST(req: Request) {
  const userId = await getDefaultUserId();
  const { name, color, parentId } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const folder = await prisma.folder.create({
    data: { name, color: color ?? "#E8431A", parentId: parentId ?? null, userId },
    include: { _count: { select: { processes: true } } },
  });

  return NextResponse.json(folder, { status: 201 });
}
