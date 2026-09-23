import type { Metadata, Viewport } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { HydrationProvider } from "@/components/layout/HydrationProvider";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { CircleDot } from "lucide-react";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "StickyTasks — Focused task management",
  description: "A calm, priority-based task manager for focused work.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans min-h-screen bg-[#0b0c0e] text-zinc-100 antialiased selection:bg-[var(--accent)] selection:text-[var(--bg)]">
        <HydrationProvider>
          <div className="app-shell flex min-h-screen">
            <Sidebar />
            {/* Layout uses width/min-height/spacers only: the unlayered `*` reset in
                globals.css zeroes every padding/margin utility (open Story 2.3 decision).
                Gutters come from calc() widths centered by this column. */}
            <div className="flex min-w-0 flex-1 flex-col items-center">
              <header className="sticky top-0 z-30 flex min-h-16 w-full justify-center border-b border-white/[0.07] bg-[#0b0c0e]/85 backdrop-blur-xl">
                <div className="flex w-[calc(100%-2rem)] max-w-370 items-center justify-between md:w-[calc(100%-5rem)]">
                  <div data-testid="mobile-brand-mark" className="flex items-center gap-2 md:hidden">
                    <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]"><CircleDot size={16} strokeWidth={2} /></span>
                    <span className="text-body font-bold text-[var(--text)]">StickyTasks</span>
                  </div>
                  <div className="hidden items-center gap-2 text-meta text-[var(--text-dim)] md:flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Workspace synced locally
                  </div>
                  <div className="ml-auto flex items-center gap-2 text-meta font-medium text-[var(--text-dim)]">
                    <span className="hidden md:inline">Your focus board</span>
                    <span className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[var(--text-dim)]">Private</span>
                  </div>
                </div>
              </header>

              <main className="flex w-[calc(100%-2rem)] max-w-370 flex-col md:w-[calc(100%-5rem)]">
                <div aria-hidden="true" className="h-6 shrink-0 md:h-10" />
                {children}
                {/* Keeps the last row clear of the fixed BottomNav (48px + safe area) on mobile. */}
                <div aria-hidden="true" className="h-24 shrink-0 md:h-10" />
              </main>
            </div>
            <BottomNav />
          </div>
        </HydrationProvider>
      </body>
    </html>
  );
}
