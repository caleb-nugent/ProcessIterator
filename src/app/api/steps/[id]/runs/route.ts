import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function canAccess(stepId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = (session.user as { id: string }).id;

  const step = await prisma.step.findUnique({
    where: { id: stepId },
    include: {
      process: { include: { shares: { where: { userId } } } },
    },
  });

  if (!step) return null;
  const isOwner = step.process.userId === userId;
  const hasShare = step.process.shares.length > 0;
  return isOwner || hasShare ? userId : null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: stepId } = await params;
  const userId = await canAccess(stepId);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { durationMs, notes, completedAt } = await req.json();

  const run = await prisma.stepRun.create({
    data: {
      stepId,
      durationMs: durationMs ?? null,
      notes: notes ?? null,
      completedAt: completedAt ? new Date(completedAt) : new Date(),
    },
  });

  return NextResponse.json(run, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: stepId } = await params;
  const userId = await canAccess(stepId);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { runId } = await req.json();
  await prisma.stepRun.delete({ where: { id: runId } });
  return NextResponse.json({ ok: true });
}
