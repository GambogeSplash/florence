"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { DemoCall } from "@/components/DemoCall";
import { Wordmark } from "@/components/Wordmark";
import { BusinessProfile, DEFAULT_PROFILE } from "@/lib/types";
import { loadProfile } from "@/lib/storage";

type Params = { slug: string };

/**
 * Customer-facing surface. The link a business shares with their customers:
 * `/c/maja-cake-studio`. Anyone who opens it lands directly in a call with
 * the business's Florence agent — no setup, no nav, just "the phone rings."
 *
 * For the hackathon, we resolve the slug to either:
 *   - The locally-stored profile (if this is the same browser that set up)
 *   - The NEXT_PUBLIC_DEMO_AGENT_ID fallback (so judges can hit any slug)
 *   - Otherwise the default Maja profile + a "demo only" notice
 *
 * In production this would resolve a slug → DB record.
 */
export default function CustomerCallPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = use(params);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const local = loadProfile();
    const fallbackAgent = process.env.NEXT_PUBLIC_DEMO_AGENT_ID || null;
    if (local?.agentId) {
      setProfile(local);
      setAgentId(local.agentId);
    } else if (fallbackAgent) {
      setProfile({ ...DEFAULT_PROFILE, name: prettifySlug(slug) });
      setAgentId(fallbackAgent);
    }
    setHydrated(true);
  }, [slug]);

  if (!hydrated) {
    return <main className="mx-auto max-w-md px-4 py-12" />;
  }

  if (!agentId || !profile) {
    return (
      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <div className="mb-6 flex justify-center">
          <Wordmark size={28} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          {prettifySlug(slug)} isn&apos;t set up yet
        </h1>
        <p className="text-muted mb-8 leading-relaxed">
          This business hasn&apos;t connected Florence. If you&apos;re looking to
          reach them, try calling their regular number.
        </p>
        <Link
          href="/"
          className="text-sm text-accent hover:text-accent-dim underline-offset-4 hover:underline"
        >
          Built with Florence →
        </Link>
      </main>
    );
  }

  return (
    <>
      {/* Minimal top bar — no full nav. This is a customer surface. */}
      <header className="border-b border-border bg-bg/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-md lg:max-w-6xl px-4 lg:px-6 h-12 flex items-center justify-between">
          <Link
            href="/"
            className="text-[10px] uppercase tracking-[0.18em] text-muted font-mono hover:text-fg transition-colors"
          >
            ← Built with Florence
          </Link>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted font-mono">
            /c/{slug}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-md lg:max-w-6xl px-4 lg:px-6 py-4 lg:py-6">
        <DemoCall profile={profile} agentId={agentId} />
      </main>
    </>
  );
}

function prettifySlug(slug: string): string {
  return slug
    .split(/[-_]/g)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}
