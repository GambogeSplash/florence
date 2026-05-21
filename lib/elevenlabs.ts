const BASE = "https://api.elevenlabs.io";

function key() {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) throw new Error("ELEVENLABS_API_KEY is not set");
  return k;
}

export async function cloneVoice(opts: {
  name: string;
  description?: string;
  audio: Blob;
  filename?: string;
}): Promise<{ voice_id: string }> {
  const form = new FormData();
  form.append("name", opts.name);
  if (opts.description) form.append("description", opts.description);
  // Pick a filename whose extension matches the actual mime type so ElevenLabs's
  // sniffer can decode it correctly. Browser MediaRecorder typically gives webm/opus.
  const filename = opts.filename || mimeToFilename(opts.audio.type);
  form.append("files", opts.audio, filename);

  const res = await fetch(`${BASE}/v1/voices/add`, {
    method: "POST",
    headers: { "xi-api-key": key() },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ElevenLabs cloneVoice failed: ${res.status} ${text}`);
  }
  return res.json();
}

function mimeToFilename(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes("webm")) return "sample.webm";
  if (m.includes("mp4") || m.includes("m4a")) return "sample.m4a";
  if (m.includes("ogg")) return "sample.ogg";
  if (m.includes("wav")) return "sample.wav";
  if (m.includes("mpeg") || m.includes("mp3")) return "sample.mp3";
  return "sample.webm";
}

export type AgentTool =
  | {
      type: "client";
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    }
  | {
      type: "system";
      name: string;
      description: string;
    };

export const END_CALL_TOOL: AgentTool = {
  type: "system",
  name: "end_call",
  description:
    "End the call gracefully when the caller has confirmed they're done — for example after they thank you, say goodbye, or after a payment link has been sent and acknowledged. Always say a brief farewell first.",
};

export async function createAgent(opts: {
  name: string;
  voiceId: string;
  systemPrompt: string;
  firstMessage: string;
  tools: AgentTool[];
}): Promise<{ agent_id: string }> {
  // Minimal create-agent payload. Extra latency fields (turn.turn_timeout,
  // tts.model_id, asr.quality, optimize_streaming_latency) caused 500s on the
  // ElevenLabs side — applying them post-create via PATCH instead.
  const body = {
    name: opts.name,
    conversation_config: {
      agent: {
        first_message: opts.firstMessage,
        language: "en",
        prompt: {
          prompt: opts.systemPrompt,
          llm: "gemini-2.0-flash-001",
          tools: opts.tools,
        },
      },
      tts: {
        voice_id: opts.voiceId,
        // English Conversational AI agents require turbo or flash v2 TTS.
        // ElevenLabs validates this string exactly — "_5" variants get rejected.
        model_id: "eleven_turbo_v2",
      },
    },
  };

  const res = await fetch(`${BASE}/v1/convai/agents/create`, {
    method: "POST",
    headers: {
      "xi-api-key": key(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ElevenLabs createAgent failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function optimizeAgentSpeed(
  agentId: string,
  opts?: { systemPrompt?: string; tools?: AgentTool[] },
): Promise<void> {
  const promptPatch: Record<string, unknown> = {
    llm: "gemini-2.0-flash-001",
  };
  if (opts?.systemPrompt) promptPatch.prompt = opts.systemPrompt;
  if (opts?.tools) promptPatch.tools = opts.tools;

  // PATCH ElevenLabs agent. We keep the body minimal because the API is strict
  // about which fields it accepts under PATCH — fields it doesn't recognize on
  // the current agent shape cause a 500. The big latency win comes from the
  // LLM swap; the rest is icing.
  const body: Record<string, unknown> = {
    conversation_config: {
      agent: { prompt: promptPatch },
    },
  };

  const res = await fetch(
    `${BASE}/v1/convai/agents/${encodeURIComponent(agentId)}`,
    {
      method: "PATCH",
      headers: {
        "xi-api-key": key(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `ElevenLabs optimizeAgentSpeed failed: ${res.status} ${text}`,
    );
  }
}

export async function updateAgentVoice(
  agentId: string,
  voiceId: string,
): Promise<void> {
  const res = await fetch(
    `${BASE}/v1/convai/agents/${encodeURIComponent(agentId)}`,
    {
      method: "PATCH",
      headers: {
        "xi-api-key": key(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversation_config: {
          tts: { voice_id: voiceId },
        },
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ElevenLabs updateAgentVoice failed: ${res.status} ${text}`);
  }
}

export async function getSignedUrl(agentId: string): Promise<string> {
  const res = await fetch(
    `${BASE}/v1/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(
      agentId,
    )}`,
    {
      headers: { "xi-api-key": key() },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ElevenLabs signed url failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { signed_url: string };
  return data.signed_url;
}
