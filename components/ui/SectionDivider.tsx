interface SectionDividerProps {
  label: string;
}

export function SectionDivider({ label }: SectionDividerProps) {
  return (
    <div className="flex items-center gap-3 py-6">
      <div className="flex-1 border-t border-[var(--border)]" />
      <span className="text-xs font-mono tracking-wider uppercase text-[var(--text-dim)]">
        {label}
      </span>
      <div className="flex-1 border-t border-[var(--border)]" />
    </div>
  );
}
