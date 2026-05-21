import { NextRequest, NextResponse } from "next/server";
import { updateAgentVoice } from "@/lib/elevenlabs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { agent_id, voice_id } = (await req.json()) as {
      agent_id: string;
      voice_id: string;
    };

    if (!agent_id || !voice_id) {
      return NextResponse.json(
        { error: "agent_id and voice_id are required" },
        { status: 400 },
      );
    }

    await updateAgentVoice(agent_id, voice_id);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
