import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if ("label" in body) data.label = body.label;
  if ("startedAt" in body) data.startedAt = new Date(body.startedAt as string);
  if ("stoppedAt" in body) data.stoppedAt = body.stoppedAt ? new Date(body.stoppedAt as string) : null;
  if (Object.keys(data).length === 0) data.stoppedAt = new Date();
  const entry = await prisma.lifeEntry.update({ where: { id }, data });
  return NextResponse.json(entry);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.lifeEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
