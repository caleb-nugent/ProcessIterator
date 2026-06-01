import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const folders = await prisma.folder.findMany({
    where: { userId },
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
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { name, color, parentId } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const folder = await prisma.folder.create({
    data: { name, color: color ?? "#E8431A", parentId: parentId ?? null, userId },
    include: { _count: { select: { processes: true } } },
  });

  return NextResponse.json(folder, { status: 201 });
}
