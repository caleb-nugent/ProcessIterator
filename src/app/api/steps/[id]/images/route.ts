import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: stepId } = await params;

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 10MB" }, { status: 400 });
  }

  try {
    const blob = await put(`steps/${stepId}/${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    const image = await prisma.stepImage.create({
      data: { stepId, url: blob.url, name: file.name },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: stepId } = await params;
  void stepId;
  const { imageId } = await req.json();

  const image = await prisma.stepImage.findUnique({ where: { id: imageId } });
  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await del(image.url);
  await prisma.stepImage.delete({ where: { id: imageId } });

  return NextResponse.json({ ok: true });
}
