import { TaskPriority } from "@/types";

const CONFIG: Record<
  TaskPriority,
  { label: string; dot: string; bg: string; color: string }
> = {
  critical: {
    label: "Critical",
    dot: "🔴",
    bg: "var(--color-critical-subtle)",
    color: "var(--color-critical)",
  },
  high: {
    label: "High",
    dot: "🟠",
    bg: "var(--color-high-subtle)",
    color: "var(--color-high)",
  },
  medium: {
    label: "Medium",
    dot: "🟡",
    bg: "var(--color-medium-subtle)",
    color: "var(--color-medium)",
  },
  low: {
    label: "Low",
    dot: "🟢",
    bg: "var(--color-low-subtle)",
    color: "var(--color-low)",
  },
};

interface PriorityBadgeProps {
  priority: TaskPriority;
  showDot?: boolean;
  size?: "sm" | "md";
}

export function PriorityBadge({ priority, showDot = true, size = "md" }: PriorityBadgeProps) {
  const cfg = CONFIG[priority];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: size === "sm" ? "2px 7px" : "3px 9px",
        borderRadius: 20,
        background: cfg.bg,
        color: cfg.color,
        fontSize: size === "sm" ? 11 : 12,
        fontWeight: 600,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {showDot && <span style={{ fontSize: 10 }}>{cfg.dot}</span>}
      {cfg.label}
    </span>
  );
}

export function getPriorityColor(priority: TaskPriority): string {
  return CONFIG[priority].color;
}

export function getPriorityDot(priority: TaskPriority): string {
  return CONFIG[priority].dot;
}
