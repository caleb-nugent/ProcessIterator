import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function authorize(folderId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = (session.user as { id: string }).id;
  const folder = await prisma.folder.findFirst({ where: { id: folderId, userId } });
  return folder ? userId : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await authorize(id);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, color } = await req.json();
  const folder = await prisma.folder.update({
    where: { id },
    data: { ...(name && { name }), ...(color && { color }) },
  });
  return NextResponse.json(folder);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await authorize(id);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.folder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
