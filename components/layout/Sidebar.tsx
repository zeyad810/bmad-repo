"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CheckCircle2, CircleDot, ListTodo, Sparkles } from "lucide-react";
import { useStats } from "@/hooks/useTasks";

const navItems = [
  { href: "/", label: "My tasks", icon: ListTodo },
  { href: "/completed", label: "Completed", icon: CheckCircle2 },
];

// Layout uses gap/width/min-height only: the unlayered `*` reset in
// globals.css zeroes every p-*/m-* utility (open Story 2.3 decision).
const ASIDE_CLASS = "hidden w-63 shrink-0 flex-col items-center border-r border-[var(--border)] bg-[var(--bg)] md:flex";
const CONTENT_CLASS = "flex w-55 flex-1 flex-col gap-8 self-center";
const BRAND_LINK_CLASS =
  "flex min-h-16 items-center gap-3 rounded-sm " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";
const BRAND_CHIP_CLASS =
  "flex h-10 w-10 items-center justify-center rounded-sm border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]";
const BRAND_NAME_CLASS = "block text-body font-bold text-[var(--text)]";
const BRAND_TAGLINE_CLASS = "block text-meta text-[var(--text-dim)]";
const SECTION_LABEL_CLASS = "font-mono text-meta uppercase tracking-[0.08em] text-[var(--text-dim)]";

// Active and inactive are separate constants so no link carries two
// conflicting bg-*/text-* utilities. Only the soft background marks active.
const NAV_ITEM_BASE_CLASS =
  "grid min-h-10 grid-cols-[40px_1fr_32px] items-center rounded-sm text-secondary font-medium transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";
const NAV_ITEM_ACTIVE_CLASS = "bg-[var(--accent-soft)] text-[var(--text)]";
const NAV_ITEM_INACTIVE_CLASS = "text-[var(--text-dim)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]";
const NAV_ICON_CLASS = "justify-self-center";
const NAV_COUNT_CLASS = "text-center font-mono text-meta tabular-nums text-[var(--text-dim)]";

const STATS_CARD_CLASS = "flex flex-col items-center rounded-sm border border-[var(--border)] bg-[var(--surface)]";
const STATS_INNER_CLASS = "flex w-[calc(100%-32px)] flex-col gap-3 min-h-36 justify-center";
const STATS_NUMBER_CLASS = "font-mono text-section tabular-nums font-semibold text-[var(--text)]";
const STATS_META_CLASS = "text-meta text-[var(--text-dim)]";
const FOOTER_CLASS = "flex min-h-12 items-center gap-2 text-meta text-[var(--text-dim)]";

export function Sidebar() {
  const pathname = usePathname();
  const stats = useStats();

  return (
    <aside className={ASIDE_CLASS}>
      <div className={CONTENT_CLASS}>
        <Link href="/" className={BRAND_LINK_CLASS}>
          <span data-testid="brand-mark" className={BRAND_CHIP_CLASS}>
            <CircleDot size={20} strokeWidth={2} />
          </span>
          <span>
            <span className={BRAND_NAME_CLASS}>StickyTasks</span>
            <span className={BRAND_TAGLINE_CLASS}>Personal command center</span>
          </span>
        </Link>

        <div className="flex flex-col gap-3">
          <div className={SECTION_LABEL_CLASS}>Workspace</div>
          <nav aria-label="Primary" className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              const count = item.href === "/" ? stats.active : stats.completedAll;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`${NAV_ITEM_BASE_CLASS} ${active ? NAV_ITEM_ACTIVE_CLASS : NAV_ITEM_INACTIVE_CLASS}`}
                >
                  <Icon size={16} strokeWidth={2} className={NAV_ICON_CLASS} />
                  <span>{item.label}</span>
                  <span className={NAV_COUNT_CLASS}>{count}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex-1" />

        <div className={STATS_CARD_CLASS}>
          <div className={STATS_INNER_CLASS}>
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-[var(--text-dim)]" />
              <span className={SECTION_LABEL_CLASS}>Today</span>
            </div>
            <div className="flex items-end justify-between">
              <span className={STATS_NUMBER_CLASS}>{stats.completedToday}</span>
              <span className={STATS_META_CLASS}>completed</span>
            </div>
            <p className={STATS_META_CLASS}>Small wins add up. Keep your queue moving.</p>
          </div>
        </div>

        <div className={FOOTER_CLASS}>
          <Sparkles size={13} /> Prioritize what matters
        </div>
      </div>
    </aside>
  );
}
