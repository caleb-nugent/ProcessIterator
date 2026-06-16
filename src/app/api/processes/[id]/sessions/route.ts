import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: processId } = await params;
  const { quantity, notes } = await req.json();

  const session = await prisma.processSession.create({
    data: {
      processId,
      quantity: quantity ?? 1,
      notes: notes?.trim() || null,
    },
    include: { stepRuns: true },
  });

  return NextResponse.json(session, { status: 201 });
}
