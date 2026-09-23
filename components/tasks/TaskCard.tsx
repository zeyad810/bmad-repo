"use client";

import { useState } from "react";
import { Task, TaskPriority } from "@/types";
import { useTaskStore } from "@/stores/task-store";
import { useConfirmDelete } from "@/hooks/useConfirmDelete";
import { Calendar, Check, ChevronDown, ChevronUp, Clock3, GripVertical, Lock, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { format, isPast, isToday, isValid, parseISO } from "date-fns";

interface TaskCardProps {
  task: Task;
  index?: number;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
  onEdit?: (task: Task) => void;
  showDragHandle?: boolean;
}

const PRIORITY_THEMES: Record<TaskPriority, { accent: string; soft: string; label: string }> = {
  critical: { accent: "#fb7185", soft: "rgba(251,113,133,0.12)", label: "Critical" },
  high: { accent: "#fb923c", soft: "rgba(251,146,60,0.12)", label: "High" },
  medium: { accent: "#facc15", soft: "rgba(250,204,21,0.12)", label: "Medium" },
  low: { accent: "#4ade80", soft: "rgba(74,222,128,0.12)", label: "Low" },
};

function formatDue(dateStr?: string) {
  if (!dateStr) return null;
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return null;
    const today = isToday(date);
    return { label: today ? "Today" : format(date, "MMM d"), isOverdue: isPast(date) && !today, isToday: today };
  } catch {
    return null;
  }
}

export function TaskCard({ task, index = 0, dragHandleProps, isDragging = false, onEdit, showDragHandle = true }: TaskCardProps) {
  const { setStatus, deleteTask, tasks } = useTaskStore();
  const { confirming: confirmingDelete, triggerRef: deleteRef, handleTrigger: handleDeleteTrigger } = useConfirmDelete(
    () => deleteTask(task.id)
  );
  const [expanded, setExpanded] = useState(false);
  const theme = PRIORITY_THEMES[task.priority] || PRIORITY_THEMES.medium;
  const isCompleted = task.status === "completed";
  const due = formatDue(task.dueDate);
  const isBlocked = task.dependencies?.some((depId) => {
    const dependency = tasks.find((item) => item.id === depId);
    return dependency && dependency.status !== "completed";
  });

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#17191c] transition-all duration-200 ${isDragging ? "z-50 scale-[1.015] shadow-2xl ring-2 ring-amber-400/70" : "hover:border-white/[0.16] hover:bg-[#1a1c20]"} ${isCompleted ? "opacity-75" : ""}`}
      style={{ borderLeftColor: theme.accent, borderLeftWidth: 3 }}
    >
      <div className="p-4 md:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {showDragHandle && !isCompleted && <div {...dragHandleProps} className="-ml-2 cursor-grab rounded-lg p-1.5 text-zinc-700 transition-colors hover:bg-white/[0.06] hover:text-zinc-300 active:cursor-grabbing active:text-amber-300" style={{ touchAction: "none" }} title="Drag to reorder"><GripVertical size={18} /></div>}
            <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ backgroundColor: theme.soft, color: theme.accent }}><span className="h-1.5 w-1.5 rounded-full bg-current" /> {theme.label}</span>
            {isBlocked && <span className="inline-flex items-center gap-1 rounded-lg bg-rose-400/10 px-2 py-1 text-[10px] font-semibold text-rose-300"><Lock size={10} /> Blocked</span>}
          </div>
          <span className="shrink-0 text-[10px] font-medium tabular-nums text-zinc-700">{String(index + 1).padStart(2, "0")}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => task.description && setExpanded(!expanded)}>
            <h3 className={`break-words text-[15px] font-semibold leading-snug tracking-[-0.01em] text-zinc-100 ${isCompleted ? "text-zinc-500 line-through" : ""}`}>{task.title}</h3>
            {task.description && <div className="mt-1.5"><p className={`whitespace-pre-wrap break-words text-[13px] leading-relaxed text-zinc-500 ${expanded ? "" : "line-clamp-2"}`}>{task.description}</p><button type="button" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 transition-colors hover:text-zinc-300">{expanded ? "Show less" : "Show details"}{expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</button></div>}
          </div>
          <div className="flex shrink-0 items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
            <button type="button" onClick={() => setStatus(task.id, isCompleted ? "backlog" : "completed")} className={`rounded-lg p-2 transition-colors ${isCompleted ? "text-emerald-400 hover:bg-emerald-400/10" : "text-zinc-500 hover:bg-emerald-400/10 hover:text-emerald-300"}`} title={isCompleted ? "Restore task" : "Mark as completed"}>{isCompleted ? <RotateCcw size={15} /> : <Check size={16} strokeWidth={2.5} />}</button>
            {onEdit && <button type="button" onClick={() => onEdit(task)} className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/[0.07] hover:text-zinc-200" title="Edit task"><Pencil size={15} /></button>}
            <button ref={deleteRef} type="button" onClick={handleDeleteTrigger} className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-white/[0.07] hover:text-zinc-200" title={confirmingDelete ? "Tap again to confirm" : "Delete task"}>{confirmingDelete ? <span className="text-[11px] font-semibold tabular-nums">Confirm?</span> : <Trash2 size={15} />}</button>
          </div>
        </div>

        {(due || task.estimatedMinutes || task.tags?.length > 0) && <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-3 text-[11px]">
          {due && <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold ${due.isOverdue ? "bg-rose-400/10 text-rose-300" : due.isToday ? "bg-amber-400/10 text-amber-300" : "bg-white/[0.06] text-zinc-500"}`}><Calendar size={12} />{due.isOverdue ? "Overdue · " : ""}{due.label}</span>}
          {task.estimatedMinutes && <span className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.06] px-2 py-1 font-medium text-zinc-500"><Clock3 size={12} />{task.estimatedMinutes} min</span>}
          {task.tags?.map((tag) => <span key={tag} className="rounded-md bg-white/[0.045] px-2 py-1 font-medium text-zinc-600">#{tag}</span>)}
        </div>}
      </div>
    </article>
  );
}
