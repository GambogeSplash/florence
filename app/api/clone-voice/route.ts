import { NextRequest, NextResponse } from "next/server";
import { cloneVoice } from "@/lib/elevenlabs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const audio = form.get("audio");
    const name = (form.get("name") as string) || "Florence business voice";

    if (!(audio instanceof Blob)) {
      return NextResponse.json(
        { error: "audio (file) is required" },
        { status: 400 },
      );
    }

    const filename = audio instanceof File ? audio.name : undefined;
    const { voice_id } = await cloneVoice({
      name,
      description: "Instant clone for Florence receptionist",
      audio,
      filename,
    });

    return NextResponse.json({ voice_id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
