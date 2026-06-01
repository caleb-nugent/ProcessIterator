import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function canEdit(stepId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = (session.user as { id: string }).id;

  const step = await prisma.step.findUnique({
    where: { id: stepId },
    include: {
      process: {
        include: { shares: { where: { userId, permission: "edit" } } },
      },
    },
  });

  if (!step) return null;
  const isOwner = step.process.userId === userId;
  const hasEditShare = step.process.shares.length > 0;
  return isOwner || hasEditShare ? userId : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await canEdit(id);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description } = await req.json();
  const step = await prisma.step.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
    },
    include: { runs: { orderBy: { completedAt: "desc" } } },
  });

  return NextResponse.json(step);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await canEdit(id);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.step.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
