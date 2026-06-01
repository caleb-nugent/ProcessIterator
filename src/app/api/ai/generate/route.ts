import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateProcessSteps } from "@/lib/anthropic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI generation is not configured. Add ANTHROPIC_API_KEY to your environment." },
      { status: 503 }
    );
  }

  const { description } = await req.json();
  if (!description?.trim()) {
    return NextResponse.json({ error: "Description required" }, { status: 400 });
  }

  try {
    const steps = await generateProcessSteps(description);
    return NextResponse.json({ steps });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
