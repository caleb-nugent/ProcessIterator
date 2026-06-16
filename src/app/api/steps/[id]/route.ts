import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { title, description } = await req.json();

  const step = await prisma.step.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
    },
    include: {
      runs: { orderBy: { completedAt: "desc" } },
      images: { orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json(step);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.step.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
