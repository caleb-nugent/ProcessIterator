import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
    client = new Anthropic({ apiKey });
  }
  return client;
}

export interface GeneratedStep {
  title: string;
  description: string;
}

export async function generateProcessSteps(
  description: string
): Promise<GeneratedStep[]> {
  const anthropic = getClient();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an expert at creating Standard Operating Procedures (SOPs).

Based on the following process description, generate a clear, actionable list of steps for the SOP.

Process description: "${description}"

Respond with ONLY a JSON array of steps, no other text. Each step should have:
- title: A short, action-oriented title (e.g., "Review incoming request")
- description: A 1-2 sentence description of what to do in this step

Example format:
[
  {"title": "Gather requirements", "description": "Collect all necessary information from the client or stakeholder before beginning work."},
  {"title": "Create initial draft", "description": "Produce a first version based on the gathered requirements."}
]

Generate between 4-10 steps as appropriate for the process.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  try {
    const steps = JSON.parse(content.text);
    if (!Array.isArray(steps)) throw new Error("Response is not an array");
    return steps as GeneratedStep[];
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }
}
