import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Florence · the voice that picks up when you can't",
  description:
    "An AI receptionist that answers calls, knows your prices, and collects deposits in your voice.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body
        className="min-h-screen bg-bg text-fg"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
