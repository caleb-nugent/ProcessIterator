import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: processId } = await params;
  const { title, description } = await req.json();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const count = await prisma.step.count({ where: { processId } });

  const step = await prisma.step.create({
    data: { processId, title, description: description ?? null, order: count },
    include: { runs: true, images: true },
  });

  await prisma.process.update({ where: { id: processId }, data: { updatedAt: new Date() } });

  return NextResponse.json(step, { status: 201 });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: processId } = await params;
  void processId;
  const { steps } = await req.json();

  await prisma.$transaction(
    steps.map((s: { id: string; order: number }) =>
      prisma.step.update({ where: { id: s.id }, data: { order: s.order } })
    )
  );

  return NextResponse.json({ ok: true });
}
