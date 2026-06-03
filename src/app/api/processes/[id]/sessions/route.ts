import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function canAccess(processId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = (session.user as { id: string }).id;

  const process = await prisma.process.findFirst({
    where: { id: processId, OR: [{ userId }, { shares: { some: { userId } } }] },
  });

  return process ? userId : null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: processId } = await params;
  const userId = await canAccess(processId);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
