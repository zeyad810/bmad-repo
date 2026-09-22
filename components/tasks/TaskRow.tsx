"use client";

import { useEffect, useRef, useState } from "react";
import { Task } from "@/types";
import { useTaskStore } from "@/stores/task-store";
import { PriorityDot } from "@/components/ui/PriorityDot";
import { Check, GripVertical, Lock, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { format, isPast, isToday, isValid, parseISO } from "date-fns";

// Quiet, quick — no numeric duration is specified in the design source
// material, so this stays consistent with @dnd-kit's own default settle
// transition (~200-250ms) rather than inventing a stricter "official" value.
const COMPLETE_TRANSITION_MS = 200;

interface TaskRowProps {
  task: Task;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
  isBacklog?: boolean;
  onEdit?: (task: Task) => void;
}

function formatDue(dateStr?: string) {
  if (!dateStr) return null;
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return null;
    const today = isToday(date);
    const overdue = isPast(date) && !today;
    return overdue ? `Overdue · ${format(date, "MMM d")}` : today ? "Today" : format(date, "MMM d");
  } catch {
    return null;
  }
}

export function TaskRow({ task, dragHandleProps, isDragging = false, isBacklog = false, onEdit }: TaskRowProps) {
  const { setStatus, deleteTask, tasks } = useTaskStore();
  const isCompleted = task.status === "completed";
  const dueLabel = formatDue(task.dueDate);
  const isBlocked = task.dependencies?.some((depId) => {
    const dependency = tasks.find((item) => item.id === depId);
    return dependency && dependency.status !== "completed";
  });
  const metaLabel = isBlocked ? "Blocked" : dueLabel;

  // Local, UI-only delay so the fade/strikethrough transition is actually
  // visible before the row is filtered out of its section (setStatus takes
  // effect synchronously in the store). Only used for the complete direction;
  // restoring (isCompleted === true) still updates immediately.
  const [isCompleting, setIsCompleting] = useState(false);
  const completeTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (completeTimeout.current) clearTimeout(completeTimeout.current);
    };
  }, []);

  function handleToggleComplete() {
    if (isCompleted) {
      setStatus(task.id, task.previousStatus || "next");
      return;
    }
    if (isCompleting) return;
    setIsCompleting(true);
    completeTimeout.current = setTimeout(() => {
      setStatus(task.id, "completed");
    }, COMPLETE_TRANSITION_MS);
  }

  const showCompletedStyle = isCompleted || isCompleting;

  return (
    <div
      className={`group flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors hover:bg-[var(--surface-2)] animate-[task-enter_180ms_ease-out] ${isDragging ? "shadow-2xl" : ""} ${isBacklog ? "opacity-[0.88]" : ""}`}
    >
      {!isCompleted && (
        <div
          {...dragHandleProps}
          aria-label="Reorder task"
          className="-ml-1 shrink-0 cursor-grab rounded-md p-1.5 text-[var(--text-dim)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] active:cursor-grabbing"
          style={{ touchAction: "none" }}
        >
          <GripVertical size={16} />
        </div>
      )}

      <PriorityDot priority={task.priority} className="shrink-0" />

      <p
        className={`min-w-0 flex-1 truncate text-body leading-snug transition-colors duration-200 ${showCompletedStyle ? "text-[var(--text-dim)] line-through" : "text-[var(--text)]"}`}
      >
        {task.title}
      </p>

      {metaLabel && (
        <span className="inline-flex shrink-0 items-center gap-1 font-mono text-meta tabular-nums text-[var(--text-dim)]">
          {isBlocked && <Lock size={11} />}
          {metaLabel}
        </span>
      )}

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={handleToggleComplete}
          disabled={isCompleting}
          aria-label={isCompleted ? "Restore task" : "Mark complete"}
          className="rounded-md p-1.5 text-[var(--text-dim)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:cursor-default disabled:hover:bg-transparent"
        >
          {isCompleted ? <RotateCcw size={15} /> : <Check size={16} strokeWidth={2.5} />}
        </button>
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(task)}
            aria-label="Edit task"
            className="rounded-md p-1.5 text-[var(--text-dim)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            <Pencil size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (confirm("Delete this task?")) deleteTask(task.id);
          }}
          aria-label="Delete task"
          className="rounded-md p-1.5 text-[var(--text-dim)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
