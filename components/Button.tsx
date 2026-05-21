import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantClass: Record<Variant, string> = {
  primary:
    "bg-accent text-black hover:bg-accent-dim active:bg-accent-dim disabled:bg-[#1A1A1A] disabled:text-[#555]",
  secondary:
    "bg-card text-fg border border-border hover:border-border-strong hover:bg-[#171717] disabled:opacity-50",
  ghost:
    "bg-transparent text-fg hover:bg-card disabled:opacity-50",
  danger:
    "bg-[#2A0F0F] text-[#FF6B6B] border border-[#3A1818] hover:bg-[#3A1414]",
};

const sizeClass: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", className = "", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...rest}
    />
  );
});
