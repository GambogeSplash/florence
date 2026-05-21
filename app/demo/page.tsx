"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { DemoCall } from "@/components/DemoCall";
import { Button } from "@/components/Button";
import { ArcFace } from "@/components/ArcFace";
import { BusinessProfile, DEFAULT_PROFILE } from "@/lib/types";
import { loadProfile } from "@/lib/storage";

export default function DemoPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const local = loadProfile();
    const fallbackAgent = process.env.NEXT_PUBLIC_DEMO_AGENT_ID || null;

    if (local?.agentId) {
      setProfile(local);
      setAgentId(local.agentId);
    } else if (fallbackAgent) {
      setProfile(DEFAULT_PROFILE);
      setAgentId(fallbackAgent);
      setUsingFallback(true);
    }
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-6xl px-6 py-12" />
      </>
    );
  }

  if (!agentId || !profile) {
    const localProfile = loadProfile();
    const halfSetup = localProfile && !localProfile.agentId;
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-md px-6 py-16 flex flex-col items-center text-center">
          <div className="relative mb-8">
            <div
              className="absolute inset-0 rounded-full blur-3xl opacity-40 pointer-events-none"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(0,255,133,0.30), transparent 70%)",
              }}
            />
            <ArcFace
              size={150}
              state={halfSetup ? "thinking" : "idle"}
              className="relative text-fg arc-breathe"
            />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            {halfSetup ? "Setup didn't finish" : "Nobody to call yet"}
          </h1>
          <p className="text-muted mb-8">
            {halfSetup
              ? "Your business is saved, but Florence isn't built. Re-run setup to finish."
              : "Set up your business in two minutes. Florence will be ready to pick up."}
          </p>
          <Link href="/setup">
            <Button size="lg">
              {halfSetup ? "Finish setup →" : "Meet Florence →"}
            </Button>
          </Link>
          <div className="mt-12 text-[10px] text-muted/70 font-mono">
            or set NEXT_PUBLIC_DEMO_AGENT_ID for a fallback agent
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-md lg:max-w-6xl px-4 lg:px-6 py-4 lg:py-6">
        {usingFallback && (
          <div className="text-[10px] uppercase tracking-wider text-muted font-mono text-center mb-3">
            Demo agent. Set up your own to call your business
          </div>
        )}
        <DemoCall profile={profile} agentId={agentId} />
      </main>
    </>
  );
}
