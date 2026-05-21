"use client";

import { useId } from "react";

type Props = {
  size?: number;
  className?: string;
  /** Show the pulsing live-dot to the left of the word. Default true. */
  showDot?: boolean;
  /** Use the gradient lettering treatment (Dia / Browser Company inspired). */
  gradient?: boolean;
  /** Use uppercase "Florence" instead of lowercase. */
  uppercase?: boolean;
};

/**
 * Florence wordmark. Lowercase italic "florence" with a subtle multicolor
 * gradient sweep across the letters — visual cousin to Dia's wordmark — plus
 * the live-dot motif (the brand essence: always picking up).
 *
 * Use `gradient={false}` for nav / dense contexts where solid currentColor
 * reads cleaner. `gradient` defaults on for hero / display contexts.
 */
export function Wordmark({
  size = 22,
  className = "",
  showDot = true,
  gradient = false,
  uppercase = false,
}: Props) {
  const id = useId();
  const gradId = `florence-grad-${id}`;
  const fontSize = size * 0.82;
  const dotSize = size * 0.32;
  const label = uppercase ? "Florence" : "florence";

  return (
    <span
      className={`inline-flex items-center gap-[0.5em] ${className}`}
      style={{ height: size }}
      aria-label="Florence"
    >
      {showDot && (
        <span
          className="relative inline-flex shrink-0"
          style={{ width: dotSize, height: dotSize }}
          aria-hidden="true"
        >
          <span className="absolute inset-0 rounded-full bg-accent opacity-60 animate-signal" />
          <span
            className="relative inline-flex rounded-full bg-accent"
            style={{ width: "100%", height: "100%" }}
          />
        </span>
      )}
      {gradient ? (
        <svg
          height={size}
          viewBox={`0 0 ${label.length * 11.5} ${size}`}
          style={{ display: "inline-block" }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00FF85" />
              <stop offset="35%" stopColor="#FAFAFA" />
              <stop offset="65%" stopColor="#FAFAFA" />
              <stop offset="100%" stopColor="#C084FC" />
            </linearGradient>
          </defs>
          <text
            x="0"
            y={size * 0.78}
            fontFamily='"Inter", system-ui, sans-serif'
            fontWeight={500}
            fontStyle="italic"
            fontSize={fontSize}
            letterSpacing={-fontSize * 0.04}
            fill={`url(#${gradId})`}
          >
            {label}
          </text>
        </svg>
      ) : (
        <span
          className="font-medium italic leading-none select-none"
          style={{
            fontSize,
            letterSpacing: "-0.025em",
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
