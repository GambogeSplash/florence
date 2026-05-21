"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArcFace } from "@/components/ArcFace";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/Button";
import { BusinessProfile } from "@/lib/types";
import { loadProfile } from "@/lib/storage";
import { formatPrice } from "@/lib/prompt";
import { playPop, unlockSound } from "@/lib/sound";

type Search = {
  amount?: string;
  currency?: string;
  description?: string;
};

/**
 * Post-payment landing. Stripe Payment Links redirect here after the customer
 * completes checkout. Renders a calm green confirmation with the amount,
 * what it was for, and a return path to the call screen.
 */
export default function PaidPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = use(searchParams);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
    // Pop on arrival so it feels like a moment of completion.
    unlockSound();
    playPop();
  }, []);

  const amount = sp.amount ? Number(sp.amount) : null;
  const cur = sp.currency || profile?.currency || "usd";
  const description = sp.description || "Deposit";
  const businessName = profile?.name || "the business";

  return (
    <main className="min-h-screen flex flex-col bg-bg">
      <header className="border-b border-border">
        <div className="mx-auto max-w-md lg:max-w-4xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Wordmark size={20} />
          <Link
            href="/"
            className="text-[10px] uppercase tracking-[0.18em] text-muted font-mono hover:text-fg transition-colors"
          >
            Built with Florence
          </Link>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        {/* Soft glow + face */}
        <div className="relative mb-8">
          <div
            className="absolute inset-0 rounded-full blur-3xl opacity-50 pointer-events-none"
            style={{
              background:
                "radial-gradient(closest-side, rgba(0,255,133,0.40), transparent 70%)",
            }}
          />
          <ArcFace
            size={140}
            state="listening"
            className="relative text-fg arc-breathe"
          />
        </div>

        <div className="text-[11px] uppercase tracking-[0.2em] text-accent font-mono mb-3">
          Payment received
        </div>

        {amount != null ? (
          <div className="text-5xl sm:text-6xl font-semibold tracking-tight mb-2 tabular-nums">
            {formatPrice(amount, cur)}
          </div>
        ) : (
          <div className="text-3xl font-semibold tracking-tight mb-2">
            Thank you
          </div>
        )}

        <div className="text-base text-muted mb-2 max-w-sm">{description}</div>

        <div className="text-sm text-muted mb-10 max-w-sm leading-relaxed">
          You&apos;re booked with{" "}
          <span className="text-fg">{businessName}</span>. Florence will let
          them know.
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Link href="/demo" className="w-full">
            <Button size="lg" className="w-full">
              Back to call
            </Button>
          </Link>
          <button
            onClick={() => window.close()}
            className="text-sm text-muted hover:text-fg transition-colors px-4 py-2"
          >
            Close tab
          </button>
        </div>
      </div>
    </main>
  );
}
