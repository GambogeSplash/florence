"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { BusinessProfile } from "@/lib/types";
import { ArcFace, ArcFaceState } from "./ArcFace";
import { Transcript, TranscriptLine } from "./Transcript";
import { PaymentLink } from "./PaymentCard";
import {
  isMuted,
  playConnect,
  playHangup,
  playPop,
  playRing,
  setMuted,
  startHum,
  stopHum,
  unlockSound,
} from "@/lib/sound";

type Props = {
  profile: BusinessProfile;
  agentId: string;
};

function CallInner({ profile, agentId }: Props) {
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [glanceCount, setGlanceCount] = useState(0);
  const nextId = useRef(0);

  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const generatePaymentLink = useCallback(
    async (params: { amount: number; description: string }) => {
      try {
        const res = await fetch("/api/generate-payment-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: params.amount,
            description: params.description,
            currency: profileRef.current.currency,
          }),
        });
        const data = (await res.json()) as PaymentLink | { error: string };
        if ("error" in data) {
          return `Payment link failed: ${data.error}`;
        }
        playPop();
        setGlanceCount((g) => g + 1);
        setLines((prev) => [
          ...prev,
          { id: nextId.current++, type: "payment" as const, payment: data },
        ]);
        return `Payment link sent on screen. Amount ${params.amount} ${data.currency.toUpperCase()} for "${params.description}".`;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return `Payment link error: ${msg}`;
      }
    },
    [],
  );

  const clientTools = useMemo(
    () => ({ generate_payment_link: generatePaymentLink }),
    [generatePaymentLink],
  );

  const conversation = useConversation({
    clientTools,
    onMessage: (m) => {
      setLines((prev) => [
        ...prev,
        {
          id: nextId.current++,
          role: m.role === "user" ? "user" : "ai",
          text: m.message,
        },
      ]);
    },
    onError: (msg) => setError(msg),
  });

  const start = useCallback(async () => {
    unlockSound();
    playRing();
    setStarting(true);
    setError(null);
    setLines([]);
    try {
      const res = await fetch(
        `/api/signed-url?agent_id=${encodeURIComponent(agentId)}`,
      );
      const data = (await res.json()) as {
        signed_url?: string;
        error?: string;
      };
      if (!data.signed_url) {
        throw new Error(data.error || "Failed to get signed URL");
      }
      await conversation.startSession({ signedUrl: data.signed_url });
    } catch (e) {
      // Translate browser errors into human-readable copy
      const raw = e instanceof Error ? e.message : String(e);
      const msg =
        e instanceof Error && e.name === "NotAllowedError"
          ? "Microphone access blocked. Click the lock icon in your browser bar and allow microphone, then try again."
          : raw.includes("Permission") || raw.toLowerCase().includes("permission denied")
            ? "Microphone access blocked. Allow microphone in your browser and try again."
            : raw;
      setError(msg);
    } finally {
      setStarting(false);
    }
  }, [agentId, conversation]);

  const end = useCallback(() => {
    conversation.endSession();
    playHangup();
    stopHum();
  }, [conversation]);

  const isConnected = conversation.status === "connected";
  const isConnecting = conversation.status === "connecting" || starting;

  // Play the "connect" cue exactly when status flips to connected; start hum.
  // Stop hum if we lose the connection.
  const wasConnectedRef = useRef(false);
  useEffect(() => {
    if (isConnected && !wasConnectedRef.current) {
      playConnect();
      startHum();
    } else if (!isConnected && wasConnectedRef.current) {
      stopHum();
    }
    wasConnectedRef.current = isConnected;
  }, [isConnected]);

  // Safety: stop hum on unmount
  useEffect(() => {
    return () => stopHum();
  }, []);

  // pulse counter for face viseme — bumps when agent voice crosses threshold
  const [facePulse, setFacePulse] = useState(0);
  const lastBumpRef = useRef(0);
  useEffect(() => {
    if (!isConnected || !conversation.isSpeaking) return;
    let raf = 0;
    const loop = () => {
      try {
        const v = conversation.getOutputVolume();
        const now = performance.now();
        if (v > 0.18 && now - lastBumpRef.current > 90) {
          lastBumpRef.current = now;
          setFacePulse((p) => p + 1);
        }
      } catch {
        /* noop */
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isConnected, conversation]);

  // mic input level
  const [inputLevel, setInputLevel] = useState(0);
  useEffect(() => {
    if (!isConnected) {
      setInputLevel(0);
      return;
    }
    let raf = 0;
    let smoothed = 0;
    const tick = () => {
      let v = 0;
      try {
        v = conversation.getInputVolume();
      } catch {
        v = 0;
      }
      const target = Math.max(0, Math.min(1, v));
      const k = target > smoothed ? 0.4 : 0.1;
      smoothed += (target - smoothed) * k;
      setInputLevel(smoothed);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isConnected, conversation]);

  const faceState: ArcFaceState = !isConnected
    ? "idle"
    : conversation.isSpeaking
      ? "speaking"
      : "listening";

  const stateLabel = !isConnected
    ? isConnecting
      ? "Picking up…"
      : "Tap to call Florence"
    : conversation.isSpeaking
      ? "Speaking"
      : "I'm listening";

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-6 lg:h-[calc(100vh-140px)]">
      {/* Call panel — full-bleed flowing gradient, face centered */}
      <div className="relative rounded-3xl overflow-hidden call-bg flex flex-col items-center justify-between p-6 sm:p-8 min-h-[480px] lg:min-h-0 lg:h-full">
        {/* depth overlays */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 35%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0) 60%), radial-gradient(80% 80% at 50% 100%, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0) 70%)",
          }}
        />

        {/* Mute toggle — top-right of the call panel */}
        <MuteButton />

        {/* Top — business avatar + name + state */}
        <div className="relative w-full flex flex-col items-center">
          {profile.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.image}
              alt=""
              className="h-12 w-12 rounded-xl object-cover mb-2 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
            />
          ) : null}
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/55 font-mono">
            {profile.type}
          </div>
          <div className="text-xl sm:text-2xl font-semibold tracking-tight text-white mt-1">
            {profile.name}
          </div>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isConnected
                  ? conversation.isSpeaking
                    ? "bg-signal animate-signal"
                    : "bg-signal"
                  : "bg-white/40"
              }`}
            />
            <span className="text-[11px] font-mono uppercase tracking-wider text-white/85">
              {stateLabel}
            </span>
          </div>
        </div>

        {/* Middle — face is the focal point */}
        <div className="relative flex items-center justify-center py-2">
          <ArcFace
            size={200}
            state={faceState}
            speakingPulse={facePulse}
            glanceTrigger={glanceCount}
            className="text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          />
        </div>

        {/* Bottom — primary action + mic level when connected */}
        <div className="relative w-full flex flex-col gap-3">
          {isConnected && <MicWaveform level={inputLevel} />}

          {!isConnected ? (
            <button
              onClick={start}
              disabled={isConnecting}
              className="w-full py-4 rounded-full bg-white text-black font-medium text-base hover:bg-white/90 active:bg-white/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? "Picking up…" : "Call Florence"}
            </button>
          ) : (
            <button
              onClick={end}
              className="w-full py-4 rounded-full bg-[#2A0F0F]/80 backdrop-blur-md border border-[#FF6B6B]/40 text-[#FF9595] font-medium text-base hover:bg-[#3A1414]/90 transition-colors"
            >
              End call
            </button>
          )}

          {error && (
            <div className="text-xs text-[#FF9595] text-center px-2">
              {error}
            </div>
          )}
          {!isConnected && !error && (
            <div className="text-xs text-white/55 text-center">
              You&apos;ll be asked for microphone access.
            </div>
          )}
        </div>
      </div>

      {/* Right column on desktop: transcript only. Payment card lives
          inside the transcript as a special line type. */}
      <div className="flex flex-col gap-3 lg:h-full lg:min-h-0">
        <div className="rounded-2xl border border-border bg-card flex flex-col overflow-hidden h-[44vh] lg:h-auto lg:flex-1 lg:min-h-0">
          <div className="px-4 pt-4 pb-2 text-[10px] uppercase tracking-wider text-muted font-mono shrink-0 border-b border-border/60 flex items-center justify-between">
            <span>Transcript</span>
            <span className="text-muted/70 normal-case tracking-normal">
              {lines.length} line{lines.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex-1 min-h-0 px-4 py-3">
            {lines.length === 0 ? (
              <TranscriptEmptyState
                connected={isConnected}
                businessName={profile.name}
              />
            ) : (
              <Transcript lines={lines} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MicWaveform({ level }: { level: number }) {
  // 20 bars. Each bar shape derived deterministically from index so the
  // pattern looks organic (taller in the middle, shorter at edges) rather
  // than a flat block. Bar height grows with input level.
  const BARS = 20;
  const bars = Array.from({ length: BARS }, (_, i) => {
    const center = (BARS - 1) / 2;
    const dist = Math.abs(i - center) / center; // 0 at center, 1 at edges
    const shape = 1 - dist * 0.65; // taller in middle
    const phase = (i * 7) % 13; // slight per-bar variation
    const noise = 0.7 + (phase / 13) * 0.6;
    const h = Math.max(3, Math.min(24, 3 + level * 28 * shape * noise));
    return h;
  });
  return (
    <div className="w-full flex items-center justify-center gap-[3px] h-8 px-2">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-white/70 transition-[height] duration-75"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

function TranscriptEmptyState({
  connected,
  businessName,
}: {
  connected: boolean;
  businessName: string;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4 py-6">
      <div className="h-10 w-10 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mb-4">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
          />
        </svg>
      </div>
      <div className="text-sm font-medium text-fg mb-1">
        {connected
          ? `Say hi — ${businessName.split(/\s/)[0]} is listening`
          : "Nothing said yet"}
      </div>
      <div className="text-xs text-muted leading-relaxed max-w-[240px]">
        {connected
          ? "Ask about a price or book a deposit. Both sides of the conversation show up here."
          : "Tap Call Florence to start. The conversation will appear here as you talk."}
      </div>
    </div>
  );
}

function MuteButton() {
  const [muted, setMutedLocal] = useState(false);
  useEffect(() => {
    setMutedLocal(isMuted());
  }, []);
  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setMutedLocal(next);
  };
  return (
    <button
      onClick={toggle}
      className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/25 backdrop-blur-md border border-white/15 text-white/90 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
      aria-label={muted ? "Unmute sounds" : "Mute sounds"}
      title={muted ? "Unmute" : "Mute"}
    >
      {muted ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M11 5L6 9H2v6h4l5 4V5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <line
            x1="22"
            y1="9"
            x2="16"
            y2="15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="16"
            y1="9"
            x2="22"
            y2="15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M11 5L6 9H2v6h4l5 4V5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M15.54 8.46a5 5 0 0 1 0 7.07"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M19.07 4.93a10 10 0 0 1 0 14.14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      )}
    </button>
  );
}

export function DemoCall(props: Props) {
  return (
    <ConversationProvider>
      <CallInner {...props} />
    </ConversationProvider>
  );
}
