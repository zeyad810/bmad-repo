"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CheckCircle2, CircleDot, ListTodo, Sparkles } from "lucide-react";
import { useStats } from "@/hooks/useTasks";

const navItems = [
  { href: "/", label: "My tasks", icon: ListTodo },
  { href: "/completed", label: "Completed", icon: CheckCircle2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const stats = useStats();

  return (
    <aside className="hidden w-[252px] shrink-0 flex-col border-r border-white/[0.07] bg-[#101113] px-4 py-5 lg:flex">
      <Link href="/" className="mb-10 flex items-center gap-3 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-amber-400 text-[#17120a] shadow-[0_8px_24px_rgba(245,158,11,0.18)]">
          <CircleDot size={22} strokeWidth={2.5} />
        </span>
        <span>
          <span className="block text-[15px] font-bold tracking-[-0.02em] text-white">StickyTasks</span>
          <span className="mt-0.5 block text-[11px] text-zinc-500">Personal command center</span>
        </span>
      </Link>

      <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">Workspace</div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          const count = item.href === "/" ? stats.active : stats.completedAll;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
                active ? "bg-amber-400/[0.12] text-amber-300" : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
              }`}
            >
              <Icon size={17} strokeWidth={active ? 2.4 : 1.9} />
              <span className="flex-1">{item.label}</span>
              <span className={`text-[11px] ${active ? "text-amber-300" : "text-zinc-600"}`}>{count}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
        <div className="mb-3 flex items-center gap-2 text-zinc-400">
          <BarChart3 size={15} className="text-amber-400" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">Today</span>
        </div>
        <div className="mb-3 flex items-end justify-between">
          <span className="text-2xl font-semibold tracking-tight text-white">{stats.completedToday}</span>
          <span className="pb-1 text-[11px] text-zinc-600">completed</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
          <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${stats.active + stats.completedToday ? Math.min(100, (stats.completedToday / (stats.active + stats.completedToday)) * 100) : 0}%` }} />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">Small wins add up. Keep your queue moving.</p>
      </div>

      <div className="mt-5 flex items-center gap-2 px-3 text-[11px] text-zinc-600">
        <Sparkles size={13} /> Prioritize what matters
      </div>
    </aside>
  );
}
