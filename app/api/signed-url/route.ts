import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@/lib/elevenlabs";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const agentId = req.nextUrl.searchParams.get("agent_id");
    if (!agentId) {
      return NextResponse.json({ error: "agent_id is required" }, { status: 400 });
    }
    const signed_url = await getSignedUrl(agentId);
    return NextResponse.json({ signed_url });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
