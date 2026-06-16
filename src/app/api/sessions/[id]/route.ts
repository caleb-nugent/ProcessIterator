import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { notes, quantity } = await req.json();

  const updated = await prisma.processSession.update({
    where: { id },
    data: {
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(quantity !== undefined && { quantity: Math.max(1, parseInt(quantity) || 1) }),
    },
    include: { stepRuns: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.processSession.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
