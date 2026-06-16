import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: stepId } = await params;
  const { durationMs, notes, completedAt, sessionId } = await req.json();

  const run = await prisma.stepRun.create({
    data: {
      stepId,
      sessionId: sessionId ?? null,
      durationMs: durationMs ?? null,
      notes: notes ?? null,
      completedAt: completedAt ? new Date(completedAt) : new Date(),
    },
  });

  return NextResponse.json(run, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: stepId } = await params;
  void stepId;
  const { runId } = await req.json();
  await prisma.stepRun.delete({ where: { id: runId } });
  return NextResponse.json({ ok: true });
}
