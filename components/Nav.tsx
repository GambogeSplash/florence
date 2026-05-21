import Link from "next/link";
import { Wordmark } from "./Wordmark";

export function Nav() {
  return (
    <nav className="border-b border-border bg-bg/80 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <Link href="/" className="group shrink-0">
          <Wordmark size={22} />
        </Link>
        <div className="flex items-center gap-0.5 sm:gap-1 text-sm">
          <Link
            href="/setup"
            className="hidden sm:inline-flex px-3 py-1.5 rounded-md text-muted hover:text-fg hover:bg-card transition-colors"
          >
            Set up
          </Link>
          <Link
            href="/dashboard"
            className="px-2.5 sm:px-3 py-1.5 rounded-md text-muted hover:text-fg hover:bg-card transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/demo"
            className="px-3 py-1.5 rounded-md bg-accent text-black font-medium hover:bg-accent-dim transition-colors sm:ml-1"
          >
            Try it →
          </Link>
        </div>
      </div>
    </nav>
  );
}
