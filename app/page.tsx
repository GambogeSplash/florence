import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/Button";

export default function Home() {
  return (
    <>
      <Nav />

      <main>
        <section className="mx-auto max-w-3xl px-6 pt-24 sm:pt-32 pb-24 sm:pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs text-muted font-mono mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-signal" />
            Built for ElevenLabs × Stripe
          </div>

          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05] mb-6">
            The voice that picks up
            <br />
            <span className="text-accent">when you can&apos;t.</span>
          </h1>

          <p className="text-lg text-muted leading-relaxed mb-10 max-w-xl mx-auto">
            Florence answers every call in your voice, knows your prices, and
            closes the sale by sending a Stripe payment link mid-conversation
            while you stay on the floor.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
