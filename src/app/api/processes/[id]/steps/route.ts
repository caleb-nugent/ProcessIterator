import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function canEdit(processId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = (session.user as { id: string }).id;

  const process = await prisma.process.findFirst({
    where: {
      id: processId,
      OR: [
        { userId },
        { shares: { some: { userId, permission: "edit" } } },
      ],
    },
  });

  return process ? userId : null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: processId } = await params;
  const userId = await canEdit(processId);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description } = await req.json();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const count = await prisma.step.count({ where: { processId } });

  const step = await prisma.step.create({
    data: { processId, title, description: description ?? null, order: count },
    include: { runs: true },
  });

  await prisma.process.update({ where: { id: processId }, data: { updatedAt: new Date() } });

  return NextResponse.json(step, { status: 201 });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: processId } = await params;
  const userId = await canEdit(processId);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { steps } = await req.json();

  await prisma.$transaction(
    steps.map((s: { id: string; order: number }) =>
      prisma.step.update({ where: { id: s.id }, data: { order: s.order } })
    )
  );

  return NextResponse.json({ ok: true });
}
