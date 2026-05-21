import { NextRequest, NextResponse } from "next/server";
import { END_CALL_TOOL, optimizeAgentSpeed } from "@/lib/elevenlabs";
import { buildSystemPrompt } from "@/lib/prompt";
import { BusinessProfile } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { agent_id, profile } = (await req.json()) as {
      agent_id: string;
      profile?: BusinessProfile;
    };
    if (!agent_id) {
      return NextResponse.json(
        { error: "agent_id is required" },
        { status: 400 },
      );
    }

    const tools = [
      {
        type: "client" as const,
        name: "generate_payment_link",
        description:
          "Generate a Stripe payment link for the customer when they want to pay a deposit or book a service. Call this only when the customer has agreed to pay.",
        parameters: {
          type: "object",
          properties: {
            amount: { type: "number" },
            description: { type: "string" },
          },
          required: ["amount", "description"],
        },
      },
      END_CALL_TOOL,
    ];

    await optimizeAgentSpeed(agent_id, {
      systemPrompt: profile ? buildSystemPrompt(profile) : undefined,
      tools,
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[optimize-agent] failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
