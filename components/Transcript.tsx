"use client";

import { useEffect, useRef } from "react";
import { PaymentCard, PaymentLink } from "./PaymentCard";

export type TranscriptLine =
  | { id: number; type?: "message"; role: "user" | "ai"; text: string }
  | { id: number; type: "payment"; payment: PaymentLink };

export function Transcript({ lines }: { lines: TranscriptLine[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto space-y-3 scroll-smooth pr-1"
    >
      {lines.length === 0 ? (
        <div className="text-muted text-sm italic pt-2 text-center">
          The conversation will appear here.
        </div>
      ) : (
        lines.map((line) => {
          if (line.type === "payment") {
            return (
              <div key={line.id} className="flex justify-start animate-fade-in">
                <div className="max-w-[85%] w-full">
                  <div className="text-[10px] uppercase tracking-wider opacity-50 mb-1.5 font-mono pl-1">
                    Florence sent a payment link
                  </div>
                  <PaymentCard link={line.payment} />
                </div>
              </div>
            );
          }
          return (
            <div
              key={line.id}
              className={`flex ${line.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  line.role === "user"
                    ? "bg-[#1A1A1A] text-fg"
                    : "bg-accent/10 text-fg border border-accent/20"
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider opacity-50 mb-1 font-mono">
                  {line.role === "user" ? "You" : "Florence"}
                </div>
                {line.text}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
