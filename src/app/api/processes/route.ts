import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultUserId } from "@/lib/defaultUser";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId");

  const processes = await prisma.process.findMany({
    where: {
      isArchived: false,
      ...(folderId === "null" ? { folderId: null } : folderId ? { folderId } : {}),
    },
    include: {
      _count: { select: { steps: true } },
      folder: { select: { id: true, name: true, color: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ own: processes, shared: [] });
}

export async function POST(req: Request) {
  const userId = await getDefaultUserId();
  const { title, description, folderId, steps } = await req.json();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const process = await prisma.process.create({
    data: {
      title,
      description: description ?? null,
      folderId: folderId ?? null,
      userId,
      steps: steps?.length
        ? {
            create: steps.map(
              (s: { title: string; description?: string }, i: number) => ({
                title: s.title,
                description: s.description ?? null,
                order: i,
              })
            ),
          }
        : undefined,
    },
    include: {
      steps: true,
      _count: { select: { steps: true } },
      folder: { select: { id: true, name: true, color: true } },
    },
  });

  return NextResponse.json(process, { status: 201 });
}
