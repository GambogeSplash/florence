"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/Button";
import { SignalDot } from "@/components/SignalDot";
import { BusinessProfile, DEFAULT_PROFILE } from "@/lib/types";
import { clearProfile, loadProfile, saveProfile } from "@/lib/storage";
import { formatPrice } from "@/lib/prompt";
import { ImageUpload } from "@/components/ImageUpload";
import { Sparkline } from "@/components/Sparkline";
import { ArcFace } from "@/components/ArcFace";

const MOCK_CALLS = [
  {
    caller: "+1 ••• ••• 4421",
    when: "12 min ago",
    duration: "2:14",
    outcome: "Payment link sent",
    amount: 40,
  },
  {
    caller: "+44 ••• ••• 9082",
    when: "1 hr ago",
    duration: "1:48",
    outcome: "Booking confirmed",
    amount: 84,
  },
  {
    caller: "+234 ••• ••• 7714",
    when: "3 hrs ago",
    duration: "0:54",
    outcome: "Question answered",
    amount: null,
  },
];

export default function DashboardPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loaded = loadProfile();
    if (loaded) {
      // Backfill missing service images. First try exact name match against
      // defaults; if no match, fall back to index (so the first 4 services
      // still get a usable image even if names drifted).
      let changed = false;
      const services = loaded.services.map((s, i) => {
        if (s.image) return s;
        const named = DEFAULT_PROFILE.services.find(
          (d) => d.name.trim().toLowerCase() === s.name.trim().toLowerCase(),
        );
        const fallback =
          named?.image ?? DEFAULT_PROFILE.services[i]?.image;
        if (fallback) {
          changed = true;
          return { ...s, image: fallback };
        }
        return s;
      });
      const next = changed ? { ...loaded, services } : loaded;
      if (changed) saveProfile(next);
      setProfile(next);
    }
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-5xl px-6 py-12" />
      </>
    );
  }

  if (!profile) {
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
              state="idle"
              className="relative text-fg arc-breathe"
            />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            No receptionist yet
          </h1>
          <p className="text-muted mb-8">
            Florence&apos;s waiting. Two minutes of setup and she&apos;s answering.
          </p>
          <Link href="/setup">
            <Button size="lg">Set up your receptionist →</Button>
          </Link>
        </main>
      </>
    );
  }

  const phone = "+1 555 010 1234";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const reset = () => {
    if (
      confirm(
        "Remove this receptionist from this browser? The ElevenLabs agent will remain in your account.",
      )
    ) {
      clearProfile();
      window.location.href = "/setup";
    }
  };

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <ClickableBusinessImage
              profile={profile}
              onChange={(image) => {
                const next = { ...profile, image };
                saveProfile(next);
                setProfile(next);
              }}
            />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted font-mono mb-1">
                Receptionist
              </div>
              <h1 className="text-xl sm:text-3xl font-semibold tracking-tight truncate">
                {profile.name}
              </h1>
              <div className="text-xs sm:text-sm text-muted mt-0.5 truncate">
                {profile.type}
              </div>
            </div>
          </div>
          <Link href="/demo" className="shrink-0">
            <Button size="md" className="sm:hidden">
              Test →
            </Button>
            <Button size="lg" className="hidden sm:inline-flex">
              Test agent →
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mb-4">
          <StatusCard isLive={!!profile.agentId} />
          <PhoneCard phone={phone} onCopy={copy} copied={copied} />
          <Card label="Calls today">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="text-2xl font-semibold tracking-tight">
                  {MOCK_CALLS.length}
                </div>
                <div className="text-xs text-muted mt-1">
                  {MOCK_CALLS.filter((c) => c.amount).length} converted ·
                  <span className="text-accent"> +200%</span> vs yesterday
                </div>
              </div>
              <Sparkline
                data={[1, 0, 1, 1, 2, 1, MOCK_CALLS.length]}
                width={104}
                height={36}
              />
            </div>
          </Card>
        </div>

        <InventorySection
          profile={profile}
          onChange={(services) => {
            const next = { ...profile, services };
            saveProfile(next);
            setProfile(next);
          }}
          onCurrencyChange={(currency) => {
            const next = { ...profile, currency };
            saveProfile(next);
            setProfile(next);
          }}
        />

        <div className="mt-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs uppercase tracking-wider text-muted font-mono">
              Recent calls
            </div>
            <div className="text-xs text-muted">Last 24 hours</div>
          </div>
          <div className="divide-y divide-border">
            {MOCK_CALLS.map((c, i) => (
              <div key={i} className="py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-mono">{c.caller}</div>
                  <div className="text-xs text-muted">
                    {c.when} · {c.duration}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm ${c.amount ? "text-signal" : "text-muted"}`}
                  >
                    {c.outcome}
                  </div>
                  {c.amount && (
                    <div className="text-xs text-muted font-mono">
                      {formatPrice(c.amount, profile.currency)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted/70 mt-4 italic">
            Mock data for the demo — real call logs land here in production.
          </div>
        </div>

        <SpeedupCard profile={profile} />

        <ChangeVoiceCard
          profile={profile}
          onSaved={(voiceId) => setProfile({ ...profile, voiceId })}
        />

        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={reset}
            className="text-xs text-muted hover:text-[#FF6B6B] transition-colors"
          >
            Reset local setup
          </button>
          {profile.agentId && (
            <span className="text-xs text-muted font-mono">
              agent_id: {profile.agentId}
            </span>
          )}
        </div>
      </main>
    </>
  );
}

function StatusCard({ isLive }: { isLive: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="text-xs uppercase tracking-wider text-muted font-mono mb-3">
        Status
      </div>
      <div className="flex items-center gap-2.5">
        <SignalDot active={isLive} />
        <div className="text-lg font-semibold tracking-tight">
          {isLive ? "Live" : "Not configured"}
        </div>
      </div>
      <div className="text-xs text-muted mt-1">
        {isLive
          ? "Your receptionist is answering calls."
          : "Finish setup to go live."}
      </div>
    </div>
  );
}

function PhoneCard({
  phone,
  onCopy,
  copied,
}: {
  phone: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="text-xs uppercase tracking-wider text-muted font-mono mb-3">
        Phone number
      </div>
      <div className="font-mono text-lg">{phone}</div>
      <button
        onClick={onCopy}
        className="text-xs text-signal hover:text-signal-dim mt-1.5 transition-colors"
      >
        {copied ? "Copied" : "Copy number"}
      </button>
    </div>
  );
}

function Card({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="text-xs uppercase tracking-wider text-muted font-mono mb-3">
        {label}
      </div>
      {children}
    </div>
  );
}

const CURRENCY_OPTIONS: Array<{ code: string; label: string; symbol: string }> = [
  { code: "usd", label: "USD · Dollar", symbol: "$" },
  { code: "eur", label: "EUR · Euro", symbol: "€" },
  { code: "gbp", label: "GBP · Pound", symbol: "£" },
  { code: "ngn", label: "NGN · Naira", symbol: "₦" },
  { code: "zar", label: "ZAR · Rand", symbol: "R" },
  { code: "kes", label: "KES · Shilling", symbol: "KSh" },
];

function InventorySection({
  profile,
  onChange,
  onCurrencyChange,
}: {
  profile: BusinessProfile;
  onChange: (services: BusinessProfile["services"]) => void;
  onCurrencyChange: (currency: string) => void;
}) {
  const [view, setView] = useState<"list" | "grid">("list");

  const update = (i: number, patch: Partial<BusinessProfile["services"][number]>) =>
    onChange(profile.services.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const remove = (i: number) =>
    onChange(profile.services.filter((_, idx) => idx !== i));

  const add = () =>
    onChange([...profile.services, { name: "New service", price: 0 }]);

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...profile.services];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted font-mono mb-0.5">
            Inventory
          </div>
          <div className="text-sm text-muted">
            {profile.services.length} item
            {profile.services.length === 1 ? "" : "s"} · the agent quotes from
            this list
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={profile.currency.toLowerCase()}
            onChange={(e) => onCurrencyChange(e.target.value)}
            className="rounded-lg bg-[#0E0E0E] border border-border px-2.5 py-1.5 text-xs text-fg font-mono focus:outline-none focus:border-signal/60"
            aria-label="Currency"
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code.toUpperCase()}
              </option>
            ))}
          </select>
          <div className="inline-flex items-center rounded-lg border border-border bg-[#0E0E0E] p-0.5">
            <button
              onClick={() => setView("list")}
              className={`px-2.5 py-1 rounded-md text-xs font-mono uppercase tracking-wider transition-colors ${
                view === "list" ? "bg-card text-fg" : "text-muted hover:text-fg"
              }`}
              aria-label="List view"
            >
              List
            </button>
            <button
              onClick={() => setView("grid")}
              className={`px-2.5 py-1 rounded-md text-xs font-mono uppercase tracking-wider transition-colors ${
                view === "grid" ? "bg-card text-fg" : "text-muted hover:text-fg"
              }`}
              aria-label="Grid view"
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {profile.services.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-[#0E0E0E] p-8 text-center">
          <div className="text-sm font-medium text-fg mb-1">
            Nothing for Florence to quote yet
          </div>
          <div className="text-xs text-muted mb-4">
            Add your first item. Florence reads from this list to answer pricing
            questions.
          </div>
          <button
            onClick={add}
            className="text-sm text-accent hover:text-accent-dim"
          >
            + Add first item
          </button>
        </div>
      ) : view === "list" ? (
        <div className="divide-y divide-border">
          <div className="flex items-center gap-3 pb-2 text-[10px] uppercase tracking-wider text-muted font-mono">
            <div className="w-14" />
            <div className="flex-1">Item</div>
            <div className="w-28 text-right">Price</div>
            <div className="w-8" />
          </div>
          {profile.services.map((s, i) => (
            <div
              key={i}
              draggable
              onDragStart={(e) => {
                setDragIdx(i);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                if (dragIdx !== null && dragIdx !== i) setOverIdx(i);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={() => {
                if (overIdx === i) setOverIdx(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIdx !== null) reorder(dragIdx, i);
                setDragIdx(null);
                setOverIdx(null);
              }}
              onDragEnd={() => {
                setDragIdx(null);
                setOverIdx(null);
              }}
              className={`flex items-center gap-3 py-3 transition-colors ${
                dragIdx === i ? "opacity-40" : ""
              } ${overIdx === i ? "bg-accent/5" : ""}`}
            >
              <div
                className="hidden sm:block text-muted/50 hover:text-muted cursor-grab active:cursor-grabbing text-xs select-none"
                title="Drag to reorder"
              >
                ⋮⋮
              </div>
              <RowImage
                value={s.image}
                fallback={s.name}
                onChange={(image) => update(i, { image })}
              />
              <input
                value={s.name}
                onChange={(e) => update(i, { name: e.target.value })}
                className="flex-1 min-w-0 bg-transparent border-none text-sm text-fg focus:outline-none focus:bg-[#0E0E0E] rounded px-1 py-1"
              />
              <PriceInput
                value={s.price}
                currency={profile.currency}
                onChange={(v) => update(i, { price: v })}
              />
              <button
                onClick={() => remove(i)}
                className="w-7 sm:w-8 text-muted hover:text-[#FF6B6B] text-lg leading-none shrink-0"
                aria-label="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {profile.services.map((s, i) => (
            <div
              key={i}
              className="group relative rounded-xl border border-border bg-[#0E0E0E] overflow-hidden"
            >
              <RowImage
                value={s.image}
                fallback={s.name}
                onChange={(image) => update(i, { image })}
                large
              />
              <div className="p-3">
                <input
                  value={s.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  className="w-full bg-transparent border-none text-sm text-fg focus:outline-none truncate"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <PriceInput
                    value={s.price}
                    currency={profile.currency}
                    onChange={(v) => update(i, { price: v })}
                    compact
                  />
                  <button
                    onClick={() => remove(i)}
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

      <div className="mt-4">
        <button
          onClick={add}
          className="text-sm text-signal hover:text-signal-dim"
        >
          + Add item
        </button>
      </div>
    </div>
  );
}

function RowImage({
  value,
  fallback,
  onChange,
  large,
}: {
  value?: string;
  fallback: string;
  onChange: (dataUrl: string | undefined) => void;
  large?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onPick = () => inputRef.current?.click();
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return;
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

  const cls = large
    ? "w-full h-32 object-cover bg-[#1A1A1A] cursor-pointer"
    : "h-14 w-14 rounded-lg object-cover shrink-0 bg-[#1A1A1A] cursor-pointer";

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
          className={`${cls} flex items-center justify-center text-muted text-sm`}
        >
          {fallback.charAt(0).toUpperCase() || "+"}
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

function PriceInput({
  value,
  currency,
  onChange,
  compact,
}: {
  value: number;
  currency: string;
  onChange: (v: number) => void;
  compact?: boolean;
}) {
  const sym =
    CURRENCY_OPTIONS.find((c) => c.code === currency.toLowerCase())?.symbol ||
    currency.toUpperCase();
  return (
    <div
      className={`relative ${compact ? "w-24" : "w-20 sm:w-28"} ${compact ? "" : "shrink-0"}`}
    >
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted text-xs font-mono pointer-events-none">
        {sym}
      </span>
      <input
        type="number"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className={`w-full bg-[#0E0E0E] border border-border rounded-lg pl-7 pr-2 ${compact ? "py-1 text-xs" : "py-1.5 text-sm"} text-fg tabular-nums text-right focus:outline-none focus:border-signal/60`}
      />
    </div>
  );
}

function ClickableBusinessImage({
  profile,
  onChange,
}: {
  profile: BusinessProfile;
  onChange: (image: string | undefined) => void;
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

  return (
    <button
      type="button"
      onClick={onPick}
      className="relative group h-16 w-16 rounded-2xl overflow-hidden shrink-0 border border-border hover:border-border-strong transition-colors"
      aria-label="Change business image"
      title="Click to change"
    >
      {profile.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.image}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-card flex items-center justify-center text-2xl font-semibold text-muted">
          {profile.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] uppercase tracking-wider text-white font-mono">
        Change
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />
    </button>
  );
}

function SpeedupCard({ profile }: { profile: BusinessProfile }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!profile.agentId) return;
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/optimize-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: profile.agentId, profile }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok) throw new Error(data.error || "Optimize failed");
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-xs uppercase tracking-wider text-muted font-mono">
          Response speed
        </div>
        <div className="text-[10px] text-muted font-mono uppercase tracking-wider">
          One-click patch
        </div>
      </div>
      <div className="text-sm text-muted leading-relaxed mb-4">
        Apply latest config to this agent: faster LLM (Gemini Flash), faster
        TTS (Turbo v2.5), 1.2s turn timeout, and enable the agent to{" "}
        <span className="text-fg">hang up</span> on its own when the call wraps.
        Safe to apply. Voice unchanged.
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={status === "saving"}>
          {status === "saving"
            ? "Updating…"
            : status === "saved"
              ? "Applied ✓"
              : "Update agent"}
        </Button>
        {error && <span className="text-xs text-[#FF6B6B]">{error}</span>}
      </div>
    </div>
  );
}

function ChangeVoiceCard({
  profile,
  onSaved,
}: {
  profile: BusinessProfile;
  onSaved: (voiceId: string) => void;
}) {
  const [voiceId, setVoiceId] = useState("");
  const [status, setStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const apply = async (id: string) => {
    if (!id.trim() || !profile.agentId) return;
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/update-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: profile.agentId,
          voice_id: id.trim(),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok) throw new Error(data.error || "Update failed");

      const updated = { ...profile, voiceId: id.trim() };
      saveProfile(updated);
      onSaved(id.trim());
      setStatus("saved");
      setVoiceId("");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  };

  const submit = () => apply(voiceId);

  const PRESETS: Array<{ label: string; id: string }> = [
    { label: "Nigerian female", id: "eOHsvebhdtt0XFeHVMQY" },
  ];

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-xs uppercase tracking-wider text-muted font-mono">
          Change voice
        </div>
        <a
          href="https://elevenlabs.io/app/voice-library"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-signal hover:text-signal-dim"
        >
          Browse ElevenLabs library →
        </a>
      </div>
      <div className="text-sm text-muted leading-relaxed mb-4">
        Want a different voice? Open the ElevenLabs Voice Library, find one
        (search e.g. <span className="text-fg font-mono">Nigerian</span>,{" "}
        <span className="text-fg font-mono">West African</span>,{" "}
        <span className="text-fg font-mono">female</span>), click{" "}
        <span className="text-fg">Add to my voices</span>, copy its{" "}
        <span className="text-fg font-mono">voice_id</span>, and paste it here.
      </div>
      {PRESETS.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted font-mono">
            Presets:
          </span>
          {PRESETS.map((p) => {
            const active = profile.voiceId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => apply(p.id)}
                disabled={status === "saving"}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  active
                    ? "border-accent/60 bg-accent/10 text-accent"
                    : "border-border bg-[#0E0E0E] text-muted hover:text-fg hover:border-border-strong"
                }`}
              >
                {p.label}{" "}
                {active && <span className="ml-1">✓</span>}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={voiceId}
          onChange={(e) => setVoiceId(e.target.value)}
          placeholder="voice_id (e.g. abc123XYZ…)"
          className="flex-1 rounded-lg bg-[#0E0E0E] border border-border px-3 py-2.5 text-sm text-fg font-mono placeholder:text-[#555] focus:outline-none focus:border-accent/60"
        />
        <Button
          onClick={submit}
          disabled={!voiceId.trim() || status === "saving"}
        >
          {status === "saving"
            ? "Updating…"
            : status === "saved"
              ? "Saved ✓"
              : "Apply"}
        </Button>
      </div>
      {profile.voiceId && (
        <div className="mt-3 text-xs text-muted font-mono">
          current: {profile.voiceId}
        </div>
      )}
      {error && <div className="mt-3 text-xs text-[#FF6B6B]">{error}</div>}
    </div>
  );
}
