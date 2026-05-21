"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/Button";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { ImageUpload } from "@/components/ImageUpload";
import { ArcFace } from "@/components/ArcFace";
import { BusinessProfile, DEFAULT_PROFILE, Service } from "@/lib/types";
import { saveProfile } from "@/lib/storage";

type Step = 1 | 2 | 3;

const DEFAULT_CURRENCY = (() => {
  if (typeof process !== "undefined") {
    return (process.env.NEXT_PUBLIC_STRIPE_CURRENCY || "usd").toLowerCase();
  }
  return "usd";
})();

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [step2View, setStep2View] = useState<"list" | "grid">("list");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(DEFAULT_PROFILE.name);
  const [type, setType] = useState(DEFAULT_PROFILE.type);
  const [greeting, setGreeting] = useState(DEFAULT_PROFILE.greeting);
  const [availability, setAvailability] = useState(DEFAULT_PROFILE.availability);
  const [services, setServices] = useState<Service[]>(DEFAULT_PROFILE.services);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [consent, setConsent] = useState(false);
  const [businessImage, setBusinessImage] = useState<string | undefined>(
    undefined,
  );

  const updateService = (i: number, patch: Partial<Service>) => {
    setServices((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };
  const addService = () => {
    if (services.length >= 6) return;
    setServices((prev) => [...prev, { name: "", price: 0 }]);
  };
  const removeService = (i: number) => {
    setServices((prev) => prev.filter((_, idx) => idx !== i));
  };

  const canNext1 = name.trim().length > 0 && type.trim().length > 0;
  const canNext2 =
    services.some((s) => s.name.trim() && s.price > 0) &&
    availability.trim().length > 0;
  const canSubmit = !!audio && consent;

  const submit = async () => {
    if (!audio) return;
    setSubmitting(true);
    setError(null);
    try {
      setSubmitMessage("Cloning your voice…");
      const form = new FormData();
      const ext = mimeExt(audio.type);
      form.append("audio", audio, `voice.${ext}`);
      form.append("name", `${name} owner voice`);
      const voiceRes = await fetch("/api/clone-voice", {
        method: "POST",
        body: form,
      });
      const voiceData = (await voiceRes.json()) as
        | { voice_id: string }
        | { error: string };
      if ("error" in voiceData) throw new Error(voiceData.error);

      setSubmitMessage("Building your receptionist…");
      const profile: BusinessProfile = {
        name,
        type,
        greeting: greeting.replace(/\[Business Name\]/gi, name),
        availability,
        services: services.filter((s) => s.name.trim() && s.price > 0),
        voiceId: voiceData.voice_id,
        currency,
        image: businessImage,
      };

      const agentRes = await fetch("/api/create-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const agentData = (await agentRes.json()) as
        | { agent_id: string }
        | { error: string };
      if ("error" in agentData) throw new Error(agentData.error);

      const final: BusinessProfile = { ...profile, agentId: agentData.agent_id };
      saveProfile(final);

      setSubmitMessage(null);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSubmitMessage(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return <SetupSuccess businessName={name} />;
  }

  return (
    <>
      <Nav />
      {submitting && <SetupLoadingOverlay message={submitMessage} />}
      <main className="mx-auto max-w-2xl px-6 py-12">
        <Stepper step={step} />

        {step === 1 && (
          <Card title="Business details" subtitle="Step 1 of 3">
            <Field label="Business logo or photo" hint="Optional. Shows on your dashboard and the call screen.">
              <ImageUpload
                value={businessImage}
                onChange={setBusinessImage}
                fallbackLetter={name.charAt(0)}
              />
            </Field>
            <Field label="Business name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maja's Cake Studio"
                className={inputClass}
              />
            </Field>
            <Field label="Business type">
              <input
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="e.g. Cake shop, Tailor, Photographer"
                className={inputClass}
              />
            </Field>
            <Field label="Greeting message" hint="What customers hear first.">
              <textarea
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                rows={3}
                className={inputClass}
              />
            </Field>
            <Field label="Currency">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={inputClass}
              >
                <option value="usd">USD · US Dollar</option>
                <option value="eur">EUR · Euro</option>
                <option value="gbp">GBP · British Pound</option>
                <option value="ngn">NGN · Nigerian Naira</option>
                <option value="zar">ZAR · South African Rand</option>
                <option value="kes">KES · Kenyan Shilling</option>
              </select>
            </Field>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep(2)} disabled={!canNext1}>
                Next →
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card title="Services & pricing" subtitle={`Step 2 of 3 · ${name}`}>
            <div className="flex items-center justify-between -mt-1 mb-1">
              <div className="text-xs text-muted">
                {services.length} item{services.length === 1 ? "" : "s"}
              </div>
              <div className="inline-flex items-center rounded-lg border border-border bg-[#0E0E0E] p-0.5">
                <button
                  type="button"
                  onClick={() => setStep2View("list")}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono uppercase tracking-wider transition-colors ${
                    step2View === "list"
                      ? "bg-card text-fg"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setStep2View("grid")}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono uppercase tracking-wider transition-colors ${
                    step2View === "grid"
                      ? "bg-card text-fg"
                      : "text-muted hover:text-fg"
                  }`}
                >
                  Grid
                </button>
              </div>
            </div>

            {step2View === "list" ? (
              <>
                <div className="flex items-center gap-2 px-1 text-[10px] uppercase tracking-wider text-muted font-mono">
                  <div className="w-12" />
                  <div className="flex-1">Service</div>
                  <div className="w-28 text-right pr-2">Price</div>
                  <div className="w-8" />
                </div>
                <div className="space-y-2 mt-2">
                  {services.map((s, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <SetupServiceImage
                        value={s.image}
                        fallback={s.name}
                        index={i}
                        onChange={(image) => updateService(i, { image })}
                      />
                      <input
                        value={s.name}
                        onChange={(e) =>
                          updateService(i, { name: e.target.value })
                        }
                        placeholder="e.g. Custom birthday cake"
                        className={`${inputClass} flex-1 min-w-0`}
                      />
                      <div className="relative w-20 sm:w-28 shrink-0">
                        <span className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-mono pointer-events-none">
                          {currencySymbol(currency)}
                        </span>
                        <input
                          type="number"
                          value={s.price || ""}
                          onChange={(e) =>
                            updateService(i, {
                              price: Number(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                          className={`${inputClass} pl-6 sm:pl-7 text-right tabular-nums`}
                        />
                      </div>
                      <button
                        onClick={() => removeService(i)}
                        className="h-[38px] w-7 sm:w-8 text-muted hover:text-[#FF6B6B] text-lg leading-none shrink-0"
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {services.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-[#0E0E0E] overflow-hidden"
                  >
                    <SetupServiceImage
                      value={s.image}
                      fallback={s.name}
                      index={i}
                      onChange={(image) => updateService(i, { image })}
                      large
                    />
                    <div className="p-3">
                      <input
                        value={s.name}
                        onChange={(e) =>
                          updateService(i, { name: e.target.value })
                        }
                        placeholder="Service name"
                        className="w-full bg-transparent border-none text-sm text-fg focus:outline-none truncate"
                      />
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="relative w-24">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted text-xs font-mono pointer-events-none">
                            {currencySymbol(currency)}
                          </span>
                          <input
                            type="number"
                            value={s.price || ""}
                            onChange={(e) =>
                              updateService(i, {
                                price: Number(e.target.value) || 0,
                              })
                            }
                            placeholder="0"
                            className="w-full bg-[#0E0E0E] border border-border rounded-lg pl-6 pr-1.5 py-1 text-xs text-fg tabular-nums text-right focus:outline-none focus:border-signal/60"
                          />
                        </div>
                        <button
                          onClick={() => removeService(i)}
                          className="text-muted hover:text-[#FF6B6B] text-sm"
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {services.length < 6 && (
              <button
                onClick={addService}
                className="text-sm text-signal hover:text-signal-dim mt-2"
              >
                + Add service
              </button>
            )}
            <Field label="When are you available?" hint="The agent will tell callers this.">
              <textarea
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                rows={2}
                className={inputClass}
              />
            </Field>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canNext2}>
                Next →
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card title="Clone your voice" subtitle="Step 3 of 3">
            <div className="text-sm text-muted mb-4 leading-relaxed">
              Record ~30 seconds. Speak naturally, anything works.
            </div>
            <VoiceRecorder
              onChange={setAudio}
              minSeconds={20}
              maxSeconds={60}
            />
            <label className="flex items-start gap-3 mt-5 p-3 rounded-lg border border-border bg-[#0E0E0E] cursor-pointer hover:border-border-strong transition-colors">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#00FF85]"
              />
              <span className="text-sm text-muted leading-relaxed">
                I confirm this is{" "}
                <span className="text-fg">my own voice</span>
                {" "}and I authorize cloning it for use as my business&apos;s
                AI receptionist.
              </span>
            </label>

            {submitMessage && (
              <div className="mt-4 text-sm text-signal font-mono">
                {submitMessage}
              </div>
            )}
            {error && (
              <div className="mt-4 text-sm text-[#FF6B6B]">{error}</div>
            )}

            <div className="flex justify-between pt-6">
              <Button
                variant="ghost"
                onClick={() => setStep(2)}
                disabled={submitting}
              >
                ← Back
              </Button>
              <Button onClick={submit} disabled={!canSubmit || submitting}>
                {submitting ? "Building…" : "Create my receptionist →"}
              </Button>
            </div>
          </Card>
        )}
      </main>
    </>
  );
}

const inputClass =
  "w-full rounded-lg bg-[#0E0E0E] border border-border px-3 py-2.5 text-sm text-fg placeholder:text-[#555] focus:outline-none focus:border-signal/60 transition-colors";

function Stepper({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className={`h-1 flex-1 rounded-full transition-colors ${
            n <= step ? "bg-signal" : "bg-[#1A1A1A]"
          }`}
        />
      ))}
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-7 space-y-5">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted font-mono mb-1">
          {subtitle}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-fg mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-xs text-muted mt-1.5">{hint}</div>}
    </label>
  );
}

function SetupSuccess({ businessName }: { businessName: string }) {
  return (
    <main className="fixed inset-0 z-30 flex flex-col items-center justify-center px-6 py-10 bg-bg animate-fade-in">
      {/* Soft glow behind face */}
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-50 pointer-events-none"
          style={{
            background:
              "radial-gradient(closest-side, rgba(0,255,133,0.40), transparent 70%)",
          }}
        />
        <ArcFace
          size={200}
          state="listening"
          className="relative text-fg arc-breathe"
        />
      </div>

      <div className="mt-10 text-center max-w-md">
        <div className="text-xs uppercase tracking-[0.2em] text-accent font-mono mb-3">
          Receptionist live
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
          Florence is ready to answer
          <br />
          for {businessName}.
        </h1>
        <p className="text-base text-muted leading-relaxed">
          Try her now. Ask for a price. Ask to book. Watch her send a Stripe
          link mid-call.
        </p>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
        <Link href="/demo" className="w-full sm:flex-1">
          <Button size="lg" className="w-full">
            Call Florence now →
          </Button>
        </Link>
        <Link href="/dashboard" className="w-full sm:w-auto">
          <Button size="lg" variant="ghost" className="w-full">
            Go to dashboard
          </Button>
        </Link>
      </div>
    </main>
  );
}

function SetupLoadingOverlay({ message }: { message: string | null }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-bg/95 backdrop-blur-md animate-fade-in">
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-50"
          style={{
            background:
              "radial-gradient(closest-side, rgba(0,255,133,0.35), transparent 70%)",
          }}
        />
        <ArcFace
          size={180}
          state="thinking"
          className="relative text-fg arc-breathe"
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="text-base font-medium tracking-tight">
          {message || "Just a moment…"}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="h-1 w-1 rounded-full bg-muted"
            style={{ animation: "dot-bounce 1.2s ease-in-out infinite" }}
          />
          <span
            className="h-1 w-1 rounded-full bg-muted"
            style={{
              animation: "dot-bounce 1.2s ease-in-out 0.15s infinite",
            }}
          />
          <span
            className="h-1 w-1 rounded-full bg-muted"
            style={{
              animation: "dot-bounce 1.2s ease-in-out 0.3s infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function currencySymbol(code: string): string {
  const map: Record<string, string> = {
    usd: "$",
    eur: "€",
    gbp: "£",
    ngn: "₦",
    zar: "R",
    kes: "KSh",
  };
  return map[code.toLowerCase()] || code.toUpperCase();
}

const AVATAR_PALETTE = [
  ["#1F2A3A", "#7BB7FF"],
  ["#2A1F3A", "#C9A0FF"],
  ["#3A2A1F", "#FFB872"],
  ["#1F3A2D", "#7CE8B5"],
  ["#3A1F2A", "#FF93B8"],
  ["#2D3A1F", "#D2E66B"],
];

function SetupServiceImage({
  value,
  fallback,
  index,
  onChange,
  large,
}: {
  value?: string;
  fallback: string;
  index: number;
  onChange: (dataUrl: string | undefined) => void;
  large?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onPick = () => inputRef.current?.click();
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !f.type.startsWith("image/")) return;
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement("canvas");
          const size = 320;
          c.width = size;
          c.height = size;
          const ctx = c.getContext("2d");
          if (!ctx) return reject(new Error("no ctx"));
          const r = Math.max(size / img.width, size / img.height);
          const w = img.width * r;
          const h = img.height * r;
          ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
          resolve(c.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => reject(new Error("decode"));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error("read"));
      reader.readAsDataURL(f);
    });
    onChange(url);
  };

  const [bg, fg] = AVATAR_PALETTE[index % AVATAR_PALETTE.length];
  const letter = (fallback.trim().charAt(0) || "?").toUpperCase();

  const cls = large
    ? "w-full h-32 object-cover bg-[#1A1A1A] cursor-pointer"
    : "h-10 w-12 rounded-lg object-cover shrink-0 bg-[#1A1A1A] cursor-pointer";

  return (
    <>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          onClick={onPick}
          className={cls}
          loading="lazy"
        />
      ) : (
        <div
          onClick={onPick}
          className={`${cls} flex items-center justify-center text-sm font-semibold`}
          style={{ background: bg, color: fg }}
        >
          {letter}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />
    </>
  );
}

function mimeExt(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes("webm")) return "webm";
  if (m.includes("mp4") || m.includes("m4a")) return "m4a";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("wav")) return "wav";
  if (m.includes("mpeg") || m.includes("mp3")) return "mp3";
  return "webm";
}
