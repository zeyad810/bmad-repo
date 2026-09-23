"use client";

import { useEffect, useRef, useState } from "react";
import { Task, TaskPriority } from "@/types";
import { useTaskStore } from "@/stores/task-store";
import { useConfirmDelete } from "@/hooks/useConfirmDelete";
import { PriorityDot } from "@/components/ui/PriorityDot";
import { Check, GripVertical, Lock, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { format, isPast, isToday, isValid, parseISO } from "date-fns";

// Quiet, quick — no numeric duration is specified in the design source
// material, so this stays consistent with @dnd-kit's own default settle
// transition (~200-250ms) rather than inventing a stricter "official" value.
const COMPLETE_TRANSITION_MS = 200;

// Hit targets are 44×44 on mobile and 32×32 from md (768px) up. Sizes come
// from h-*/w-*, not p-*: the unlayered `*` reset in globals.css zeroes padding.
// The root stays `div.group` — E2E specs locate rows by it.
const ROW_BASE_CLASS =
  "group flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] transition-colors " +
  "hover:bg-[var(--surface-2)] animate-[task-enter_180ms_ease-out] md:min-h-12 md:gap-3";
const TARGET_CLASS =
  "flex h-11 shrink-0 items-center justify-center rounded-sm text-[var(--text-dim)] transition-colors " +
  "hover:bg-[var(--surface-2)] hover:text-[var(--text)] md:h-8 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";
// touch-none: @dnd-kit's PointerSensor needs touch-action: none on the handle.
const HANDLE_CLASS = `${TARGET_CLASS} w-11 cursor-grab touch-none active:cursor-grabbing md:w-8`;
const ICON_BUTTON_CLASS = `${TARGET_CLASS} w-11 md:w-8`;
const CHECK_BUTTON_CLASS = `${ICON_BUTTON_CLASS} disabled:cursor-default disabled:hover:bg-transparent`;
// min-w, not w: the armed "Confirm?" label is wider than 44px and must not clip.
const DELETE_BUTTON_CLASS = `${TARGET_CLASS} min-w-11 md:min-w-8`;
// Meta sits under the title on mobile so the title keeps usable width.
const TEXT_BLOCK_CLASS = "flex min-w-0 flex-1 flex-col md:flex-row md:items-center md:gap-3";
const TITLE_BASE_CLASS = "min-w-0 truncate text-body leading-snug transition-colors duration-200 md:flex-1";
const META_CLASS = "inline-flex shrink-0 items-center gap-1 font-mono text-meta tabular-nums text-[var(--text-dim)]";
const ACTIONS_CLASS = "flex shrink-0 items-center gap-0 md:gap-1";

// Priority as text for assistive tech — the dot alone is color-only.
const PRIORITY_LABEL: Record<TaskPriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

/**
 * Keeps keyboard focus in the list when a row is about to be removed:
 * next row's complete button, else the previous row's, else quick-add.
 */
function focusAfterRemoval(rowEl: HTMLElement | null) {
  const item = rowEl?.closest("li");
  const neighbour = [item?.nextElementSibling, item?.previousElementSibling]
    .map((el) => el?.querySelector<HTMLButtonElement>("[data-row-complete]"))
    .find(Boolean);
  const target = neighbour ?? document.querySelector<HTMLInputElement>('input[aria-label="Add a task"]');
  target?.focus();
}

interface TaskRowProps {
  task: Task;
  dragHandleProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  /** @dnd-kit activator ref, so keyboard drops restore focus to the handle. */
  dragHandleRef?: (el: HTMLElement | null) => void;
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

export function TaskRow({ task, dragHandleProps, dragHandleRef, isDragging = false, isBacklog = false, onEdit }: TaskRowProps) {
  const { setStatus, deleteTask, tasks } = useTaskStore();
  const rowRef = useRef<HTMLDivElement>(null);
  // Only move focus for keyboard users — never pull focus from a pointer user.
  const focusIsInRow = () => rowRef.current?.contains(document.activeElement) ?? false;
  const { confirming: confirmingDelete, triggerRef: deleteRef, handleTrigger: handleDeleteTrigger } = useConfirmDelete(
    () => {
      if (focusIsInRow()) focusAfterRemoval(rowRef.current);
      deleteTask(task.id);
    }
  );
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
    // Capture this before disabling the focused control. Browsers move focus
    // to body as soon as the button becomes disabled, before the delayed
    // removal callback has a chance to inspect the row.
    const shouldRestoreFocus = focusIsInRow();
    setIsCompleting(true);
    completeTimeout.current = setTimeout(() => {
      if (shouldRestoreFocus) focusAfterRemoval(rowRef.current);
      setStatus(task.id, "completed");
    }, COMPLETE_TRANSITION_MS);
  }

  const showCompletedStyle = isCompleted || isCompleting;

  return (
    <div ref={rowRef} className={`${ROW_BASE_CLASS} ${isDragging ? "shadow-2xl" : ""} ${isBacklog ? "opacity-[0.88]" : ""}`}>
      {!isCompleted && (
        <button
          type="button"
          ref={dragHandleRef}
          {...dragHandleProps}
          aria-label={`Reorder task: ${task.title}`}
          className={HANDLE_CLASS}
        >
          <GripVertical size={16} />
        </button>
      )}

      <PriorityDot priority={task.priority} className="shrink-0" />
      <span className="sr-only">{PRIORITY_LABEL[task.priority]} priority</span>

      <div className={TEXT_BLOCK_CLASS}>
        <p className={`${TITLE_BASE_CLASS} ${showCompletedStyle ? "text-[var(--text-dim)] line-through" : "text-[var(--text)]"}`}>
          {task.title}
        </p>

        {metaLabel && (
          <span className={META_CLASS}>
            {isBlocked && <Lock size={11} />}
            {metaLabel}
          </span>
        )}
      </div>

      <div className={ACTIONS_CLASS}>
        <button
          type="button"
          onClick={handleToggleComplete}
          disabled={isCompleting}
          aria-label={`${isCompleted ? "Restore task" : "Mark complete"}: ${task.title}`}
          data-row-complete=""
          className={CHECK_BUTTON_CLASS}
        >
          {isCompleted ? <RotateCcw size={15} /> : <Check size={16} strokeWidth={2.5} />}
        </button>
        {onEdit && (
          <button type="button" onClick={() => onEdit(task)} aria-label={`Edit task: ${task.title}`} className={ICON_BUTTON_CLASS}>
            <Pencil size={14} />
          </button>
        )}
        <button
          ref={deleteRef}
          type="button"
          onClick={handleDeleteTrigger}
          aria-label={`${confirmingDelete ? "Confirm delete task" : "Delete task"}: ${task.title}`}
          className={DELETE_BUTTON_CLASS}
        >
          {confirmingDelete ? (
            <span className="font-mono text-meta font-medium tabular-nums text-[var(--text)]">Confirm?</span>
          ) : (
            <Trash2 size={14} />
          )}
        </button>
      </div>
    </div>
  );
}
