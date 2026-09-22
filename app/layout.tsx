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
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "StickyTasks — Focused task management",
  description: "A calm, priority-based task manager for focused work.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans min-h-screen bg-[#0b0c0e] text-zinc-100 antialiased selection:bg-amber-400 selection:text-zinc-950">
        <HydrationProvider>
          <div className="app-shell flex min-h-screen">
            <Sidebar />
            <div className="min-w-0 flex-1">
              <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#0b0c0e]/85 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-10">
                <div className="mx-auto flex max-w-[1480px] items-center justify-between">
                  <div className="flex items-center gap-2 lg:hidden">
                    <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-amber-400 text-[#17120a]"><CircleDot size={17} strokeWidth={2.5} /></span>
                    <span className="text-sm font-bold text-white">StickyTasks</span>
                  </div>
                  <div className="hidden items-center gap-2 text-[12px] text-zinc-500 lg:flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Workspace synced locally
                  </div>
                  <div className="ml-auto flex items-center gap-2 text-[11px] font-medium text-zinc-500">
                    <span className="hidden sm:inline">Your focus board</span>
                    <span className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-2.5 py-1.5 text-zinc-400">Private</span>
                  </div>
                </div>
              </header>

              <main className="mx-auto w-full max-w-[1480px] px-4 pb-28 pt-7 sm:px-6 lg:px-10 lg:pb-10 lg:pt-10">
                {children}
              </main>
            </div>
            <BottomNav />
          </div>
        </HydrationProvider>
      </body>
    </html>
  );
}
