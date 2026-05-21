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

        <section className="mx-auto max-w-5xl px-6 pb-20">
          <div className="rounded-2xl border border-border bg-card p-8 md:p-12">
            <div className="text-xs uppercase tracking-wider text-muted font-mono mb-6">
              How a call goes
            </div>
            <div className="space-y-5 text-base md:text-lg leading-relaxed">
              <Line who="cust">
                Hi, I&apos;m looking for a birthday cake for next Saturday.
              </Line>
              <Line who="florence" emphasized>
                Lovely. We do 8&quot; custom birthday cakes at forty-five
                dollars. Six-inch is thirty. What flavor were you thinking?
              </Line>
              <Line who="cust">Red velvet, eight-inch.</Line>
              <Line who="florence" emphasized>
                Beautiful. To hold that slot I&apos;ll send you a deposit link
                now. Fifteen dollars, you pay the rest on pickup.{" "}
                <span className="text-accent">One moment.</span>
              </Line>
              <div className="ml-12 inline-flex items-center gap-2 text-xs text-accent font-mono uppercase tracking-wider pl-1">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 0L8.5 5.5L14 7L8.5 8.5L7 14L5.5 8.5L0 7L5.5 5.5L7 0Z"
                    fill="currentColor"
                  />
                </svg>
                Payment link sent · $15.00
              </div>
            </div>
            <div className="mt-8 text-sm text-muted">
              The agent decided when to send the link. Not a button. Not a
              schedule-a-callback. The sale closed on the call.
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="grid md:grid-cols-3 gap-4">
            <Feature
              title="Trained in 2 minutes"
              body="Add your services and prices, record 30 seconds of your voice. We do the rest."
            />
            <Feature
              title="Cloned, not generic"
              body="Customers hear you. Warm, on-brand. ElevenLabs verification keeps it your voice only."
            />
            <Feature
              title="Closes on the call"
              body="The agent decides when to send a Stripe payment link. Most receptionists schedule callbacks. This one collects."
            />
          </div>
        </section>

        <footer className="mx-auto max-w-5xl px-6 py-10 border-t border-border text-xs text-muted flex items-center justify-between">
          <div>
            Florence · built with ElevenLabs Conversational AI + Stripe Payment
            Links.
          </div>
          <Link href="/demo" className="text-accent hover:text-accent-dim">
            Meet Florence →
          </Link>
        </footer>
      </main>
    </>
  );
}

function Line({
  who,
  emphasized,
  children,
}: {
  who: "cust" | "florence";
  emphasized?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      {who === "florence" ? <FlorenceAvatar /> : <CustomerAvatar />}
      <div className={`pt-1 ${emphasized ? "text-fg" : "text-muted"}`}>
        {children}
      </div>
    </div>
  );
}

function FlorenceAvatar() {
  return (
    <div
      className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0 shadow-[0_4px_16px_-4px_rgba(0,255,133,0.45)]"
      aria-label="Florence"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-black/80" />
    </div>
  );
}

function CustomerAvatar() {
  return (
    <div
      className="h-8 w-8 rounded-full bg-[#1F1F1F] border border-[#2A2A2A] flex items-center justify-center shrink-0"
      aria-label="Customer"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="5" r="2.4" fill="#8A8A8A" />
        <path
          d="M2.5 12.5 C 3 9.5, 11 9.5, 11.5 12.5 Z"
          fill="#8A8A8A"
        />
      </svg>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="font-medium tracking-tight mb-2">{title}</div>
      <div className="text-sm text-muted leading-relaxed">{body}</div>
    </div>
  );
}
