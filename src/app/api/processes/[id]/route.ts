import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function authorizeProcess(processId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = (session.user as { id: string }).id;

  const process = await prisma.process.findFirst({
    where: {
      id: processId,
      OR: [{ userId }, { shares: { some: { userId } } }],
    },
  });

  return process ? { userId, isOwner: process.userId === userId } : null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorizeProcess(id);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const process = await prisma.process.findUnique({
    where: { id },
    include: {
      steps: {
        orderBy: { order: "asc" },
        include: {
          runs: { orderBy: { completedAt: "desc" } },
          images: { orderBy: { createdAt: "asc" } },
        },
      },
      folder: { select: { id: true, name: true, color: true } },
      shares: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      sessions: {
        orderBy: { createdAt: "desc" },
        include: { stepRuns: true },
      },
    },
  });

  return NextResponse.json(process);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorizeProcess(id);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, folderId, isArchived } = await req.json();
  const process = await prisma.process.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(folderId !== undefined && { folderId }),
      ...(isArchived !== undefined && { isArchived }),
    },
    include: {
      _count: { select: { steps: true } },
      folder: { select: { id: true, name: true, color: true } },
    },
  });

  return NextResponse.json(process);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorizeProcess(id);
  if (!auth || !auth.isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.process.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
