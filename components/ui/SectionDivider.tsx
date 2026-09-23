interface SectionDividerProps {
  label: string;
  /** Heading id, so the section below can be named via aria-labelledby. */
  id?: string;
}

export function SectionDivider({ label, id }: SectionDividerProps) {
  return (
    <div className="flex items-center gap-3 py-6">
      <div aria-hidden="true" className="flex-1 border-t border-[var(--border)]" />
      <h2 id={id} className="text-xs font-mono tracking-wider uppercase text-[var(--text-dim)]">
        {label}
      </h2>
      <div aria-hidden="true" className="flex-1 border-t border-[var(--border)]" />
    </div>
  );
}
