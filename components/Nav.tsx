import Link from "next/link";
import { Wordmark } from "./Wordmark";

export function Nav() {
  return (
    <nav className="border-b border-border bg-bg/80 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <Link href="/" className="group">
          <Wordmark size={20} />
        </Link>
        <div className="flex items-center gap-1 text-sm">
          <Link
            href="/setup"
            className="px-3 py-1.5 rounded-md text-muted hover:text-fg hover:bg-card transition-colors"
          >
            Set up
          </Link>
          <Link
            href="/dashboard"
            className="px-3 py-1.5 rounded-md text-muted hover:text-fg hover:bg-card transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/demo"
            className="px-3 py-1.5 rounded-md bg-accent text-black font-medium hover:bg-accent-dim transition-colors ml-2"
          >
            Try it →
          </Link>
        </div>
      </div>
    </nav>
  );
}
