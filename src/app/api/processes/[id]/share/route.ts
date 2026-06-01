import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function isOwner(processId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = (session.user as { id: string }).id;
  const process = await prisma.process.findFirst({ where: { id: processId, userId } });
  return process ? userId : null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: processId } = await params;
  const userId = await isOwner(processId);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, permission } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const targetUser = await prisma.user.findUnique({ where: { email } });
  if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (targetUser.id === userId)
    return NextResponse.json({ error: "Cannot share with yourself" }, { status: 400 });

  const share = await prisma.processShare.upsert({
    where: { processId_userId: { processId, userId: targetUser.id } },
    create: { processId, userId: targetUser.id, permission: permission ?? "view" },
    update: { permission: permission ?? "view" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(share, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: processId } = await params;
  const userId = await isOwner(processId);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shareId } = await req.json();
  await prisma.processShare.delete({ where: { id: shareId } });
  return NextResponse.json({ ok: true });
}
