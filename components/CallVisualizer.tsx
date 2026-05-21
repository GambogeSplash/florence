"use client";

import { useEffect, useRef, useState } from "react";
import { ArcFace, ArcFaceState } from "./ArcFace";

type Props = {
  isSpeaking: boolean;
  isConnected: boolean;
  businessName: string;
  /** 0..1, optional — used to nudge the mouth visemes with voice amplitude */
  getOutputVolume?: () => number;
};

export function CallVisualizer({
  isSpeaking,
  isConnected,
  businessName,
  getOutputVolume,
}: Props) {
  // Convert continuous volume into a discrete pulse counter for ArcFace.
  // Each time the volume rises above a threshold (a "loud frame"), increment.
  const [pulse, setPulse] = useState(0);
  const lastBumpRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isConnected || !isSpeaking || !getOutputVolume) return;

    const loop = () => {
      let v = 0;
      try {
        v = getOutputVolume();
      } catch {
        v = 0;
      }
      const now = performance.now();
      if (v > 0.18 && now - lastBumpRef.current > 90) {
        lastBumpRef.current = now;
        setPulse((p) => p + 1);
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isConnected, isSpeaking, getOutputVolume]);

  const faceState: ArcFaceState = !isConnected
    ? "idle"
    : isSpeaking
      ? "speaking"
      : "listening";

  const stateLabel = !isConnected
    ? "Tap to call"
    : isSpeaking
      ? "Speaking…"
      : "Listening";

  return (
    <div className="flex flex-col items-center">
      <ArcFace
        size={220}
        state={faceState}
        speakingPulse={pulse}
        className="text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
      />

      <div className="mt-8 text-center">
        <div className="text-lg font-semibold tracking-tight text-white">
          {businessName}
        </div>
        <div className="text-xs text-white/55 mt-1 font-mono uppercase tracking-[0.18em]">
          {stateLabel}
        </div>
      </div>
    </div>
  );
}
