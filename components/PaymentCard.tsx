"use client";

import { formatPrice } from "@/lib/prompt";

export type PaymentLink = {
  url: string;
  amount: number;
  currency: string;
  description: string;
};

export function PaymentCard({ link }: { link: PaymentLink }) {
  return (
    <div className="rounded-2xl border border-accent/40 bg-gradient-to-b from-[#0A1F14] to-[#0A1410] p-5 animate-payment-arrive shadow-[0_8px_40px_-12px_rgba(0,255,133,0.25)]">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent mb-3">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M7 0L8.5 5.5L14 7L8.5 8.5L7 14L5.5 8.5L0 7L5.5 5.5L7 0Z"
            fill="currentColor"
          />
        </svg>
        Payment link sent
      </div>

      <div className="text-2xl font-semibold tracking-tight mb-1">
        {formatPrice(link.amount, link.currency)}
      </div>
      <div className="text-sm text-muted mb-4">{link.description}</div>

      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center bg-accent text-black font-medium py-3 rounded-full hover:bg-accent-dim transition-colors"
      >
        Pay deposit →
      </a>

      <div className="mt-3 text-[10px] text-muted/70 font-mono truncate">
        {link.url}
      </div>
    </div>
  );
}
