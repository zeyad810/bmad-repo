import { TaskPriority } from "@/types";

export const PRIORITY_DOT_CLASS: Record<TaskPriority, string> = {
  critical: "bg-[var(--pri-high)]",
  high: "bg-[var(--pri-high)]",
  medium: "bg-[var(--pri-med)]",
  low: "bg-[var(--pri-low)]",
};

interface PriorityDotProps {
  priority: TaskPriority;
  className?: string;
}

export function PriorityDot({ priority, className = "" }: PriorityDotProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-[7px] w-[7px] shrink-0 rounded-full ${PRIORITY_DOT_CLASS[priority] ?? PRIORITY_DOT_CLASS.medium} ${className}`}
    />
  );
}
