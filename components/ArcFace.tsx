"use client";

import { useEffect, useRef, useState } from "react";

export type ArcFaceState = "idle" | "listening" | "thinking" | "speaking";

type Props = {
  size?: number;
  state?: ArcFaceState;
  speakingPulse?: number;
  /** Increment this to make the face briefly glance toward {x, y} (in svg coords). */
  glanceTrigger?: number;
  /** Direction to glance when glanceTrigger fires. Defaults to bottom-right. */
  glanceDirection?: { x: number; y: number };
  className?: string;
};

export function ArcFace({
  size = 220,
  state = "idle",
  speakingPulse,
  glanceTrigger,
  glanceDirection,
  className,
}: Props) {
  const visemeIdx = useAnimatedViseme(state === "speaking", speakingPulse);
  const blink = useBlink();
  const gaze = useGaze(state, glanceTrigger, glanceDirection);
  const alive = state !== "idle";

  // Eye shape per state:
  //   listening → wide alert (slightly taller)
  //   speaking  → relaxed normal
  //   thinking  → slight squint (shorter)
  //   idle      → normal
  const eyeH =
    state === "listening" ? 34 : state === "thinking" ? 26 : 32;
  const eyeY = state === "listening" ? 21 : state === "thinking" ? 25 : 22;

  // Blink collapses vertical height to a sliver
  const blinkScale = blink ? 0.08 : 1;

  return (
    <svg
      width={size}
      height={size}
      viewBox="22 16 56 80"
      fill="none"
      className={`block ${alive ? "arc-breathe" : ""} ${className || ""}`}
      aria-hidden="true"
      style={{ transformOrigin: "50% 50%" }}
    >
      {/* whole face shifts micro-amounts with gaze direction */}
      <g
        style={{
          transform: `translate(${gaze.x}px, ${gaze.y}px)`,
          transition: "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Left eye */}
        <g style={{ transformOrigin: "38.5px 38px" }}>
          <rect
            x="33"
            y={eyeY}
            width="11"
            height={eyeH}
            rx="5.5"
            fill="currentColor"
            style={{
              transform: `scaleY(${blinkScale})`,
              transformOrigin: "38.5px 38px",
              transition: blink
                ? "transform 80ms ease-out"
                : "transform 120ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />
        </g>

        {/* Right eye */}
        <g style={{ transformOrigin: "61.5px 38px" }}>
          <rect
            x="56"
            y={eyeY}
            width="11"
            height={eyeH}
            rx="5.5"
            fill="currentColor"
            style={{
              transform: `scaleY(${blinkScale})`,
              transformOrigin: "61.5px 38px",
              transition: blink
                ? "transform 80ms ease-out"
                : "transform 120ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />
        </g>

        {/* Mouth */}
        <Mouth state={state} visemeIdx={visemeIdx} />
      </g>
    </svg>
  );
}

function Mouth({
  state,
  visemeIdx,
}: {
  state: ArcFaceState;
  visemeIdx: number;
}) {
  if (state === "speaking") {
    const visemes: Array<"M" | "O" | "A" | "E"> = [
      "A", "O", "E", "A", "O", "M", "A", "E",
    ];
    const v = visemes[visemeIdx % visemes.length];

    if (v === "M") {
      return (
        <path
          d="M 38 76 L 62 76"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      );
    }
    if (v === "E") {
      return <ellipse cx="50" cy="76" rx="10" ry="3.4" fill="currentColor" />;
    }
    if (v === "O") {
      return <ellipse cx="50" cy="76" rx="6.2" ry="6.4" fill="currentColor" />;
    }
    return <ellipse cx="50" cy="76.5" rx="9.6" ry="8.4" fill="currentColor" />;
  }

  if (state === "thinking") {
    return <ellipse cx="50" cy="76" rx="3.2" ry="3.2" fill="currentColor" />;
  }

  // idle / listening — curved smile
  return (
    <path
      d="M 30 68 Q 50 92, 70 68"
      stroke="currentColor"
      strokeWidth="6.5"
      strokeLinecap="round"
      fill="none"
    />
  );
}

function useAnimatedViseme(active: boolean, pulse?: number) {
  const [idx, setIdx] = useState(0);
  const reducedRef = useRef(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || pulse == null) return;
    setIdx((n) => (n + 1) % 1000);
  }, [active, pulse]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = mq.matches;
    if (!active || reducedRef.current) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setIdx((n) => (n + 1 + Math.floor(Math.random() * 3)) % 1000);
    }, 140);
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active]);

  return idx;
}

/**
 * useBlink — fires a brief "true" every 3-7 seconds (organic timing).
 * The blink lasts ~110ms total: collapse to ~8% height, hold, return.
 */
function useBlink() {
  const [blinking, setBlinking] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    let cancelled = false;
    let timeout: number | null = null;

    const scheduleNext = () => {
      // Random 2.4–6.4s gap. Occasionally a quick double-blink.
      const next = 2400 + Math.random() * 4000;
      timeout = window.setTimeout(() => {
        if (cancelled) return;
        setBlinking(true);
        window.setTimeout(() => {
          if (cancelled) return;
          setBlinking(false);
          if (Math.random() < 0.18) {
            // double blink
            window.setTimeout(() => {
              if (cancelled) return;
              setBlinking(true);
              window.setTimeout(() => {
                if (cancelled) return;
                setBlinking(false);
                scheduleNext();
              }, 110);
            }, 140);
          } else {
            scheduleNext();
          }
        }, 110);
      }, next);
    };

    scheduleNext();
    return () => {
      cancelled = true;
      if (timeout !== null) window.clearTimeout(timeout);
    };
  }, []);
  return blinking;
}

/**
 * useGaze — subtle eye/face translation by a few pixels.
 * Shifts every ~1.5–3s while listening; smaller drifts when idle/speaking.
 */
function useGaze(
  state: ArcFaceState,
  glanceTrigger?: number,
  glanceDirection?: { x: number; y: number },
) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Free-running subtle saccades while the face is alive
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    let cancelled = false;
    const amp = state === "listening" ? 1.6 : state === "speaking" ? 0.7 : 1.1;

    const tick = () => {
      if (cancelled) return;
      const x = (Math.random() - 0.5) * 2 * amp;
      const y = (Math.random() - 0.5) * 1.2 * amp;
      setOffset({ x, y });
      const wait = 1400 + Math.random() * 1600;
      window.setTimeout(tick, wait);
    };
    const initial = window.setTimeout(tick, 700);
    return () => {
      cancelled = true;
      window.clearTimeout(initial);
    };
  }, [state]);

  // Glance trigger: when caller increments glanceTrigger, lock gaze toward the
  // requested direction for ~900ms (the "oh!" moment when the payment lands),
  // then return to the free-running saccades. Direction is in svg-coord
  // pixels, typically 2-4 in magnitude. Defaults to bottom-right.
  useEffect(() => {
    if (glanceTrigger == null) return;
    if (typeof window === "undefined") return;
    const dir = glanceDirection ?? { x: 3.5, y: 2.2 };
    setOffset(dir);
    const release = window.setTimeout(() => {
      setOffset({ x: 0, y: 0 });
    }, 900);
    return () => window.clearTimeout(release);
  }, [glanceTrigger, glanceDirection?.x, glanceDirection?.y]);

  return offset;
}
