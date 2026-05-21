"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/Button";
import { ArcFace } from "@/components/ArcFace";

export default function Home() {
  return (
    <>
      <Nav />

      <main>
        <section className="mx-auto max-w-6xl px-6 pt-16 sm:pt-20 pb-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs text-muted font-mono mb-8">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-signal" />
                Built for ElevenLabs × Stripe
              </div>

              <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] mb-6">
                The voice that picks up
                <br />
                <span className="text-accent">when you can&apos;t.</span>
              </h1>

              <p className="text-lg text-muted leading-relaxed mb-8">
                Florence answers every call in your voice, knows your prices, and
                closes the sale by sending a Stripe payment link
                mid-conversation while you stay on the floor.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/demo">
                  <Button size="lg" className="w-full sm:w-auto">
                    Hear it talk to you →
                  </Button>
                </Link>
                <Link href="/setup">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    Set up in 2 minutes
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: face on the call gradient — a peek at the demo */}
            <div className="relative aspect-square sm:aspect-[4/5] lg:aspect-square rounded-3xl overflow-hidden call-bg max-w-md mx-auto w-full">
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(60% 60% at 50% 40%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0) 60%), radial-gradient(80% 80% at 50% 100%, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0) 70%)",
                }}
              />
              <div className="relative h-full flex flex-col items-center justify-center p-8">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/55 font-mono mb-1">
                  Cake shop
                </div>
                <div className="text-lg font-semibold tracking-tight text-white mb-6">
                  Maja&apos;s Cake Studio
                </div>
                <ArcFace
                  size={180}
                  state="speaking"
                  className="text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                />
                <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-signal" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-white/85">
                    On a call
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted font-mono mb-4">
                How a call goes
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.1] mb-5">
                Florence decides when to close the sale.
              </h2>
              <p className="text-base text-muted leading-relaxed max-w-md">
                Not a button. Not a schedule-a-callback. Mid-conversation,
                she sends the Stripe link, and the deposit lands before the
                customer hangs up.
              </p>
            </div>

            <PhoneCallMockup />
          </div>
        </section>

        <footer className="mx-auto max-w-6xl px-6 py-8 border-t border-border text-xs text-muted flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span>Built with</span>
            <BuiltWithLogos />
          </div>
          <Link href="/demo" className="text-accent hover:text-accent-dim">
            Meet Florence →
          </Link>
        </footer>
      </main>
    </>
  );
}

type ScriptStep =
  | { kind: "cust"; text: string }
  | { kind: "florence"; text: string }
  | { kind: "payment"; amount: string; label: string };

const SCRIPT: ScriptStep[] = [
  {
    kind: "cust",
    text: "Hi, I'm looking for a birthday cake for next Saturday.",
  },
  {
    kind: "florence",
    text: "Lovely. We do 8\" custom cakes at forty-five dollars. Six-inch is thirty. What flavor were you thinking?",
  },
  { kind: "cust", text: "Red velvet, eight-inch." },
  {
    kind: "florence",
    text: "Beautiful. To hold that slot I'll send a deposit link now — fifteen dollars, rest on pickup.",
  },
  { kind: "payment", amount: "$15.00", label: "Deposit · Birthday Cake (8\")" },
];

function PhoneCallMockup() {
  const [revealed, setRevealed] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    let started = false;
    const timeouts: number[] = [];

    const run = () => {
      if (started) return;
      started = true;
      const delays = [400, 1500, 2900, 3900, 5400];
      delays.forEach((d, i) => {
        timeouts.push(window.setTimeout(() => setRevealed(i + 1), d));
      });
    };

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) run();
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(node);

    return () => {
      obs.disconnect();
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return (
    <div ref={containerRef} className="flex justify-center">
      <div
        className="relative rounded-[44px] border border-border-strong bg-[#080808] p-3 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] w-full max-w-[340px]"
        style={{ aspectRatio: "9 / 17" }}
      >
        <div className="absolute top-3 left-1/2 -translate-x-1/2 h-5 w-24 rounded-full bg-black border border-[#1A1A1A] z-10" />

        <div className="relative h-full w-full rounded-[34px] overflow-hidden bg-bg flex flex-col">
          <div className="h-10 shrink-0 flex items-center justify-between px-6 text-[10px] font-mono text-fg/80">
            <span className="tabular-nums">9:41</span>
            <span>
              <svg width="14" height="9" viewBox="0 0 14 9" fill="none">
                <rect
                  x="0.5"
                  y="0.5"
                  width="11"
                  height="8"
                  rx="1.5"
                  stroke="currentColor"
                />
                <rect x="2" y="2" width="8" height="5" fill="currentColor" />
                <rect
                  x="12.5"
                  y="3"
                  width="1.2"
                  height="3"
                  rx="0.4"
                  fill="currentColor"
                />
              </svg>
            </span>
          </div>

          <div className="px-5 pb-3 text-center shrink-0">
            <div className="mx-auto mb-2 inline-flex items-center justify-center h-10 w-10 rounded-full bg-accent/15 border border-accent/30">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-signal" />
            </div>
            <div className="text-[9px] uppercase tracking-[0.18em] text-muted font-mono">
              On a call · 0:42
            </div>
            <div className="text-sm font-semibold tracking-tight mt-0.5">
              Maja&apos;s Cake Studio
            </div>
          </div>

          <div className="h-px w-full bg-border/60 shrink-0" />

          <div className="flex-1 overflow-hidden flex flex-col-reverse">
            <div className="px-3.5 pb-4 pt-3 space-y-2">
              {SCRIPT.slice(0, revealed).map((step, i) => (
                <ChatBubble key={i} step={step} />
              ))}
              {revealed > 0 && revealed < SCRIPT.length && (
                <TypingDots
                  side={SCRIPT[revealed].kind === "cust" ? "right" : "left"}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ step }: { step: ScriptStep }) {
  if (step.kind === "payment") {
    return (
      <div className="flex justify-start animate-slide-up">
        <div className="max-w-[88%] w-full rounded-2xl border border-accent/40 bg-gradient-to-b from-[#0A1F14] to-[#0A1410] p-3 shadow-[0_6px_24px_-8px_rgba(0,255,133,0.30)]">
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-accent font-mono mb-1.5">
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 0L8.5 5.5L14 7L8.5 8.5L7 14L5.5 8.5L0 7L5.5 5.5L7 0Z"
                fill="currentColor"
              />
            </svg>
            Payment link sent
          </div>
          <div className="text-xl font-semibold tracking-tight">
            {step.amount}
          </div>
          <div className="text-[10px] text-muted mt-0.5">{step.label}</div>
          <div className="mt-2.5 w-full text-center bg-accent text-black text-[11px] font-medium py-1.5 rounded-full">
            Pay deposit →
          </div>
        </div>
      </div>
    );
  }
  const isCust = step.kind === "cust";
  return (
    <div
      className={`flex animate-slide-up ${isCust ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed ${
          isCust
            ? "bg-[#1A1A1A] text-fg"
            : "bg-accent/10 text-fg border border-accent/20"
        }`}
      >
        {step.text}
      </div>
    </div>
  );
}

function TypingDots({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={`flex ${side === "right" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`rounded-2xl px-3 py-2.5 flex items-center gap-1 ${
          side === "right"
            ? "bg-[#1A1A1A]"
            : "bg-accent/10 border border-accent/20"
        }`}
      >
        <span
          className="h-1 w-1 rounded-full bg-muted"
          style={{ animation: "dot-bounce 1.2s ease-in-out infinite" }}
        />
        <span
          className="h-1 w-1 rounded-full bg-muted"
          style={{ animation: "dot-bounce 1.2s ease-in-out 0.15s infinite" }}
        />
        <span
          className="h-1 w-1 rounded-full bg-muted"
          style={{ animation: "dot-bounce 1.2s ease-in-out 0.3s infinite" }}
        />
      </div>
    </div>
  );
}

function BuiltWithLogos() {
  return (
    <div className="flex items-center gap-3 text-fg/80">
      <svg
        viewBox="0 0 80 24"
        height="14"
        aria-label="ElevenLabs"
        className="opacity-80 hover:opacity-100 transition-opacity"
        fill="currentColor"
      >
        {/* Stylized ElevenLabs mark — two vertical bars */}
        <rect x="3" y="4" width="5" height="16" rx="1" />
        <rect x="11" y="4" width="5" height="16" rx="1" />
        <text
          x="22"
          y="17"
          fontFamily='"Inter", system-ui, sans-serif'
          fontWeight={500}
          fontSize="13"
          letterSpacing="-0.02em"
        >
          ElevenLabs
        </text>
      </svg>
      <span className="text-muted/40">·</span>
      <svg
        viewBox="0 0 60 24"
        height="14"
        aria-label="Stripe"
        className="opacity-80 hover:opacity-100 transition-opacity"
        fill="currentColor"
      >
        <text
          x="0"
          y="17"
          fontFamily='"Inter", system-ui, sans-serif'
          fontWeight={700}
          fontSize="15"
          letterSpacing="-0.04em"
          fontStyle="italic"
        >
          Stripe
        </text>
      </svg>
    </div>
  );
}
