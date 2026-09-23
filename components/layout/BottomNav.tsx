"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, ListTodo } from "lucide-react";
import { useStats } from "@/hooks/useTasks";

const NAV_CLASS = "fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-xl md:hidden";
const LIST_CLASS = "flex w-full items-center pb-safe";

// Icon-only; the active tab differs by color alone — same size, stroke and
// background in both states. Color lives on the link and the icon/count
// inherit it via currentColor. min-h-12 = 48px tap target (no py-*: the
// unlayered reset in globals.css zeroes padding utilities).
const ITEM_BASE_CLASS =
  "flex min-h-12 flex-1 items-center justify-center rounded-sm transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";
const ITEM_ACTIVE_CLASS = "text-[var(--accent)]";
const ITEM_INACTIVE_CLASS = "text-[var(--text-dim)] hover:text-[var(--text)]";
const COUNT_CLASS = "absolute -right-4 -top-2 font-mono text-meta leading-none tabular-nums";

export function BottomNav() {
  const pathname = usePathname();
  const stats = useStats();
  const items = [
    { href: "/", label: "Tasks", icon: ListTodo, count: stats.active },
    { href: "/completed", label: "Completed", icon: CheckCircle2, count: stats.completedAll },
  ];

  return (
    <nav aria-label="Primary" data-testid="bottom-nav" className={NAV_CLASS}>
      <div className={LIST_CLASS}>
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`${ITEM_BASE_CLASS} ${active ? ITEM_ACTIVE_CLASS : ITEM_INACTIVE_CLASS}`}
            >
              <span className="relative">
                <Icon size={20} strokeWidth={2} />
                {item.count > 0 && <span className={COUNT_CLASS}>{item.count}</span>}
              </span>
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
