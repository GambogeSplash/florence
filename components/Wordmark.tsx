"use client";

type Props = {
  size?: number;
  className?: string;
  /** Show the pulsing live-dot to the left of the logo. Default false — the
   *  florence.svg already carries the brand. Set true in dense nav contexts. */
  showDot?: boolean;
};

/**
 * Florence wordmark. Renders the supplied `/public/florence.svg` — the
 * user-provided brand mark — at the requested pixel height. Width auto-scales
 * with the logo's native aspect ratio (~5.87:1, so height 22 ≈ width 130).
 */
export function Wordmark({
  size = 22,
  className = "",
  showDot = false,
}: Props) {
  const dotSize = size * 0.36;
  return (
    <span
      className={`inline-flex items-center gap-[0.5em] ${className}`}
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/florence.svg"
        alt="Florence"
        height={size}
        style={{
          height: size,
          width: "auto",
          display: "block",
          // Stack tight drop-shadows in the same color to add visual weight
          // to the rasterized logo (acts like a bolder weight).
          filter:
            "drop-shadow(0 0 0.35px currentColor) drop-shadow(0 0 0.35px currentColor)",
        }}
        draggable={false}
      />
    </span>
  );
}
