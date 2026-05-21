"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./Button";

type Status = "idle" | "recording" | "stopped";

type Props = {
  minSeconds?: number;
  maxSeconds?: number;
  onChange: (blob: Blob | null) => void;
};

export function VoiceRecorder({
  minSeconds = 15,
  maxSeconds = 60,
  onChange,
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);

  const stopTick = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (!mediaRecorderRef.current) return;
    if (mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    stopTick();
  }, [stopTick]);

  const start = useCallback(async () => {
    setError(null);
    setAudioUrl(null);
    onChange(null);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, {
        mimeType: pickMime(),
      });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });
        setAudioUrl(URL.createObjectURL(blob));
        onChange(blob);
        setStatus("stopped");
      };

      mr.start();
      startedAtRef.current = Date.now();
      setElapsed(0);
      setStatus("recording");
      tickRef.current = window.setInterval(() => {
        const secs = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setElapsed(secs);
        if (secs >= maxSeconds) {
          stop();
        }
      }, 200);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not access microphone. Check browser permissions.",
      );
      setStatus("idle");
    }
  }, [maxSeconds, onChange, stop]);

  useEffect(() => {
    return () => {
      stop();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setElapsed(0);
    setAudioUrl(null);
    onChange(null);
  }, [onChange]);

  return (
    <div className="rounded-xl border border-border bg-[#0E0E0E] p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="font-mono text-2xl tabular-nums">
          {formatTime(elapsed)}{" "}
          <span className="text-muted text-sm">/ {formatTime(maxSeconds)}</span>
        </div>
        <div
          className={`text-xs font-mono uppercase tracking-wider ${status === "recording" ? "text-accent animate-signal" : "text-muted"}`}
        >
          {status === "recording" ? "● Recording" : status === "stopped" ? "Ready" : "Idle"}
        </div>
      </div>

      <Waveform
        stream={streamRef.current}
        active={status === "recording"}
        progress={Math.min(1, elapsed / maxSeconds)}
      />
      <div className="h-[2px] w-full bg-[#1A1A1A] rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-accent transition-all duration-200"
          style={{
            width: `${Math.min(100, (elapsed / maxSeconds) * 100)}%`,
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        {status === "idle" && (
          <Button onClick={start} size="md" className="flex-1">
            Start recording
          </Button>
        )}
        {status === "recording" && (
          <Button onClick={stop} size="md" variant="danger" className="flex-1">
            Stop ({formatTime(maxSeconds - elapsed)} left)
          </Button>
        )}
        {status === "stopped" && (
          <>
            <Button onClick={reset} size="md" variant="secondary">
              Re-record
            </Button>
            <audio
              src={audioUrl || ""}
              controls
              className="flex-1 h-10"
              style={{ filter: "invert(0.92)" }}
            />
          </>
        )}
      </div>

      {error && <div className="mt-3 text-xs text-[#FF6B6B]">{error}</div>}

      {status === "stopped" && elapsed < minSeconds && (
        <div className="mt-3 text-xs text-[#FFB84D]">
          For a better clone, record at least {minSeconds} seconds.
        </div>
      )}
    </div>
  );
}

const BAR_COUNT = 36;

function Waveform({
  stream,
  active,
  progress,
}: {
  stream: MediaStream | null;
  active: boolean;
  progress: number;
}) {
  const [bars, setBars] = useState<number[]>(() =>
    new Array(BAR_COUNT).fill(0),
  );
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!stream || !active) {
      setBars(new Array(BAR_COUNT).fill(0));
      return;
    }

    let cancelled = false;
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.6;
      src.connect(analyser);

      audioCtxRef.current = ctx;
      sourceRef.current = src;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const smoothed = new Float32Array(BAR_COUNT);

      const loop = () => {
        if (cancelled) return;
        analyser.getByteFrequencyData(data);
        // Map 64 frequency bins onto 36 bars by bucketing
        const next: number[] = [];
        const step = data.length / BAR_COUNT;
        for (let i = 0; i < BAR_COUNT; i++) {
          const start = Math.floor(i * step);
          const end = Math.floor((i + 1) * step);
          let max = 0;
          for (let j = start; j < end; j++) {
            if (data[j] > max) max = data[j];
          }
          const target = max / 255;
          const prev = smoothed[i];
          const k = target > prev ? 0.55 : 0.18;
          smoothed[i] = prev + (target - prev) * k;
          next.push(smoothed[i]);
        }
        setBars(next);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      console.warn("[waveform] audio analyser failed:", e);
    }

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      try {
        sourceRef.current?.disconnect();
      } catch {
        /* noop */
      }
      try {
        analyserRef.current?.disconnect();
      } catch {
        /* noop */
      }
      try {
        audioCtxRef.current?.close();
      } catch {
        /* noop */
      }
      audioCtxRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
    };
  }, [stream, active]);

  return (
    <div className="flex items-center justify-between gap-[3px] h-16 mb-3 px-1">
      {bars.map((v, i) => {
        // Position 0..1 across the waveform
        const pos = i / (BAR_COUNT - 1);
        // Past-progress bars get muted; future bars stay green
        const past = pos < progress;
        const idle = !active;
        const h = Math.max(3, Math.min(56, idle ? 4 : 6 + v * 56));
        return (
          <div
            key={i}
            style={{
              height: `${h}px`,
              transition: active ? "height 60ms linear" : "height 220ms ease-out",
            }}
            className={`w-1 rounded-full ${
              idle
                ? "bg-[#262626]"
                : past
                  ? "bg-accent/40"
                  : "bg-accent"
            }`}
          />
        );
      })}
    </div>
  );
}

function pickMime(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
  ];
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "audio/webm";
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
