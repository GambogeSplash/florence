"use client";

import { useCallback, useRef, useState } from "react";

type Props = {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  /** Square output size in pixels. Default 256. */
  size?: number;
  className?: string;
  /** Optional fallback letter when no image is set. */
  fallbackLetter?: string;
};

const ACCEPTED = "image/png,image/jpeg,image/webp,image/gif";
const MAX_INPUT_BYTES = 10 * 1024 * 1024; // 10MB raw upload cap

export function ImageUpload({
  value,
  onChange,
  size = 256,
  className,
  fallbackLetter,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!file.type.startsWith("image/")) {
        setError("Pick an image file (PNG, JPG, WebP).");
        return;
      }
      if (file.size > MAX_INPUT_BYTES) {
        setError("That image is over 10MB. Try a smaller one.");
        return;
      }
      setBusy(true);
      try {
        const url = await resizeToDataURL(file, size);
        onChange(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not read that file.");
      } finally {
        setBusy(false);
      }
    },
    [onChange, size],
  );

  const onPick = () => inputRef.current?.click();

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const clear = () => onChange(undefined);

  return (
    <div className={className}>
      <div
        onClick={onPick}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPick();
          }
        }}
        className={`relative flex items-center gap-4 rounded-xl border-2 border-dashed bg-[#0E0E0E] p-3 cursor-pointer transition-colors ${
          dragging
            ? "border-accent/60 bg-accent/5"
            : "border-border hover:border-border-strong"
        }`}
      >
        <div className="h-16 w-16 rounded-xl overflow-hidden bg-[#1A1A1A] shrink-0 flex items-center justify-center">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl text-muted">
              {fallbackLetter ? fallbackLetter.charAt(0).toUpperCase() : "+"}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-fg">
            {value ? "Change image" : "Upload business logo or photo"}
          </div>
          <div className="text-xs text-muted mt-0.5">
            PNG, JPG, WebP · max 10MB · square crop fits best
          </div>
          {error && (
            <div className="text-xs text-[#FF6B6B] mt-1">{error}</div>
          )}
          {busy && (
            <div className="text-xs text-accent mt-1 font-mono">Processing…</div>
          )}
        </div>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clear();
            }}
            className="text-muted hover:text-[#FF6B6B] text-sm px-2"
            aria-label="Remove image"
          >
            ×
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={onInput}
        className="hidden"
      />
    </div>
  );
}

/**
 * Reads the file, draws it onto a square canvas (center-cropped), and returns
 * a JPEG data URL. Resizing client-side keeps localStorage and prompt payloads
 * small — no backend needed.
 */
async function resizeToDataURL(file: File, size: number): Promise<string> {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported in this browser.");

  // center-crop to square
  const ratio = Math.max(size / img.width, size / img.height);
  const w = img.width * ratio;
  const h = img.height * ratio;
  const dx = (size - w) / 2;
  const dy = (size - h) / 2;
  ctx.drawImage(img, dx, dy, w, h);

  return canvas.toDataURL("image/jpeg", 0.86);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not decode image."));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}
