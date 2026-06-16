import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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

  if (!process) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(process);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  await prisma.process.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
