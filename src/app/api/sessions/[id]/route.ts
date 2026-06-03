import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function canAccess(sessionId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = (session.user as { id: string }).id;

  const ps = await prisma.processSession.findUnique({
    where: { id: sessionId },
    include: { process: { include: { shares: { where: { userId } } } } },
  });

  if (!ps) return null;
  const isOwner = ps.process.userId === userId;
  const hasShare = ps.process.shares.length > 0;
  return isOwner || hasShare ? userId : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await canAccess(id);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  const userId = await canAccess(id);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.processSession.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
