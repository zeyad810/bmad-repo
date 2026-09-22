"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, ListTodo } from "lucide-react";
import { useStats } from "@/hooks/useTasks";

export function BottomNav() {
  const pathname = usePathname();
  const stats = useStats();
  const items = [
    { href: "/", label: "Tasks", icon: ListTodo, count: stats.active, activeClass: "text-amber-300 bg-amber-400/10" },
    { href: "/completed", label: "Completed", icon: CheckCircle2, count: stats.completedAll, activeClass: "text-emerald-300 bg-emerald-400/10" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.08] bg-[#101113]/90 px-4 pt-2 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-sm items-center gap-2 pb-safe">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} className={`relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition-colors ${active ? item.activeClass : "text-zinc-600 hover:text-zinc-300"}`}><span className="relative"><Icon size={19} strokeWidth={active ? 2.5 : 1.8} />{item.count > 0 && <span className="absolute -right-3 -top-2 min-w-[16px] rounded-full bg-white/[0.12] px-1 py-0.5 text-center text-[9px] leading-none text-zinc-400">{item.count}</span>}</span>{item.label}</Link>;
        })}
      </div>
    </nav>
  );
}
