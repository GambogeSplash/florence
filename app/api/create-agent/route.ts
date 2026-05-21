import { NextRequest, NextResponse } from "next/server";
import {
  createAgent,
  END_CALL_TOOL,
  optimizeAgentSpeed,
} from "@/lib/elevenlabs";
import { buildSystemPrompt } from "@/lib/prompt";
import { BusinessProfile } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const profile = (await req.json()) as BusinessProfile;
    if (!profile.voiceId) {
      return NextResponse.json(
        { error: "voiceId is required — clone a voice first" },
        { status: 400 },
      );
    }

    const systemPrompt = buildSystemPrompt(profile);

    const tools = [
      {
        type: "client" as const,
        name: "generate_payment_link",
        description:
          "Generate a Stripe payment link for the customer when they want to pay a deposit or book a service. Call this only when the customer has agreed to pay.",
        parameters: {
          type: "object",
          properties: {
            amount: {
              type: "number",
              description:
                "Deposit amount in whole units of the local currency (e.g., 40 for $40). For a deposit, use 30% of the service price rounded to the nearest whole number.",
            },
            description: {
              type: "string",
              description:
                "Short human-readable description of what the payment is for (e.g., 'Deposit — Custom Birthday Cake').",
            },
          },
          required: ["amount", "description"],
        },
      },
      END_CALL_TOOL,
    ];

    const { agent_id } = await createAgent({
      name: `Florence — ${profile.name}`,
      voiceId: profile.voiceId,
      systemPrompt,
      firstMessage: profile.greeting,
      tools,
    });

    // Immediately apply low-latency settings (turn_timeout 0.5s, Gemini
    // Flash LLM, max streaming). Without this, the agent uses ElevenLabs's
    // default 7s turn timeout and feels glacial. Best-effort — if the PATCH
    // fails, the agent still works, just slower; user can retry via the
    // dashboard's "Update agent" button.
    try {
      await optimizeAgentSpeed(agent_id, { systemPrompt, tools });
    } catch (optErr) {
      console.warn(
        "[create-agent] post-create optimize failed:",
        optErr instanceof Error ? optErr.message : String(optErr),
      );
    }

    return NextResponse.json({ agent_id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[create-agent] failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
