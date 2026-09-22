export function HydrationSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-lg bg-[var(--surface-2)] animate-pulse"
          />
        ))}
      </div>
      
      <div className="flex items-center gap-3 py-6">
        <div className="flex-1 border-t border-[var(--border)]" />
        <div className="h-4 w-20 rounded bg-[var(--surface-2)] animate-pulse" />
        <div className="flex-1 border-t border-[var(--border)]" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-lg bg-[var(--surface-2)] animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
