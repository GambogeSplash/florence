export function SignalDot({ active = true }: { active?: boolean }) {
  return (
    <span className="relative inline-flex h-2 w-2">
      {active && (
        <span className="absolute inset-0 rounded-full bg-signal opacity-60 animate-signal" />
      )}
      <span
        className={`relative inline-flex h-2 w-2 rounded-full ${active ? "bg-signal" : "bg-[#3A3A3A]"}`}
      />
    </span>
  );
}
