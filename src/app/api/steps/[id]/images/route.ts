import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put, del } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


async function canAccess(stepId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = (session.user as { id: string }).id;

  const step = await prisma.step.findUnique({
    where: { id: stepId },
    include: {
      process: { include: { shares: { where: { userId } } } },
    },
  });

  if (!step) return null;
  const isOwner = step.process.userId === userId;
  const hasShare = step.process.shares.length > 0;
  return isOwner || hasShare ? userId : null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: stepId } = await params;
  const userId = await canAccess(stepId);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 10MB" }, { status: 400 });
  }

  const blob = await put(`steps/${stepId}/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  const image = await prisma.stepImage.create({
    data: { stepId, url: blob.url, name: file.name },
  });

  return NextResponse.json(image, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: stepId } = await params;
  const userId = await canAccess(stepId);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { imageId } = await req.json();

  const image = await prisma.stepImage.findUnique({ where: { id: imageId } });
  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await del(image.url);
  await prisma.stepImage.delete({ where: { id: imageId } });

  return NextResponse.json({ ok: true });
}
