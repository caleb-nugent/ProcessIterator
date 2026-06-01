import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId");

  const ownProcesses = await prisma.process.findMany({
    where: {
      userId,
      isArchived: false,
      ...(folderId === "null" ? { folderId: null } : folderId ? { folderId } : {}),
    },
    include: {
      _count: { select: { steps: true } },
      folder: { select: { id: true, name: true, color: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const sharedProcesses = await prisma.process.findMany({
    where: {
      isArchived: false,
      shares: { some: { userId } },
    },
    include: {
      _count: { select: { steps: true } },
      folder: { select: { id: true, name: true, color: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ own: ownProcesses, shared: sharedProcesses });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { title, description, folderId, steps } = await req.json();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const process = await prisma.process.create({
    data: {
      title,
      description: description ?? null,
      folderId: folderId ?? null,
      userId,
      steps: steps?.length
        ? {
            create: steps.map(
              (s: { title: string; description?: string }, i: number) => ({
                title: s.title,
                description: s.description ?? null,
                order: i,
              })
            ),
          }
        : undefined,
    },
    include: {
      steps: true,
      _count: { select: { steps: true } },
      folder: { select: { id: true, name: true, color: true } },
    },
  });

  return NextResponse.json(process, { status: 201 });
}
