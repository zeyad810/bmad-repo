"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Trash2 } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { useCompletedTasks } from "@/hooks/useTasks";
import { useConfirmDelete } from "@/hooks/useConfirmDelete";
import { useTaskStore } from "@/stores/task-store";
import { Task } from "@/types";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskDrawer } from "@/components/tasks/TaskDrawer";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

const VIEW_ACTIVE_LINK_CLASS =
  "inline-flex items-center gap-1 min-h-11 rounded-sm px-3.5 py-2 text-secondary font-medium text-[var(--accent)] transition-opacity hover:opacity-85 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

function formatDateGroup(dateStr?: string) {
  if (!dateStr) return "Recently completed";
  try { const date = parseISO(dateStr); return isValid(date) ? format(date, "EEEE, MMMM d") : "Recently completed"; } catch { return "Recently completed"; }
}

export default function CompletedPage() {
  const completedTasks = useCompletedTasks();
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const [editTask, setEditTask] = useState<Task | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const groups: Record<string, Task[]> = {};
  completedTasks.forEach((task) => { const key = formatDateGroup(task.completedAt); (groups[key] ??= []).push(task); });

  const { confirming: confirmingClearAll, triggerRef: clearAllRef, handleTrigger: handleClearAll } = useConfirmDelete(
    () => completedTasks.forEach((task) => deleteTask(task.id))
  );

  return (
    <div className="space-y-7 md:space-y-9">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-200"><ArrowLeft size={14} /> Back to my tasks</Link>
          <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Archive</p>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] text-white md:text-4xl">Completed work.</h1>
          <p className="mt-2 text-sm text-zinc-500">A record of the things you have moved forward.</p>
        </div>
        {completedTasks.length > 0 && <Button ref={clearAllRef} type="button" variant={confirmingClearAll ? "danger" : "secondary"} size="sm" onClick={handleClearAll} className="w-fit min-h-11 px-4 py-2"><Trash2 size={14} /> {confirmingClearAll ? "Tap to confirm" : "Clear archive"}</Button>}
      </section>

      <section className="surface-panel p-4 md:p-6">
        <div className="mb-5 flex items-center gap-2 border-b border-white/[0.07] pb-5"><CheckCircle2 size={18} className="text-emerald-400" /><h2 className="text-lg font-semibold tracking-tight text-white">All completed</h2><span className="rounded-md bg-emerald-400/10 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-300">{completedTasks.length}</span></div>
        {completedTasks.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            description="Finished tasks will collect here as you make progress."
            action={<Link href="/" className={VIEW_ACTIVE_LINK_CLASS}>View active tasks <span aria-hidden="true">→</span></Link>}
          />
        ) : <div className="space-y-7">{Object.entries(groups).map(([dateLabel, tasksInGroup]) => <div key={dateLabel}><div className="mb-3 flex items-center gap-3"><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">{dateLabel}</span><div className="h-px flex-1 bg-white/[0.07]" /></div><div className="space-y-3">{tasksInGroup.map((task, index) => <TaskCard key={task.id} task={task} index={index} showDragHandle={false} onEdit={(item) => { setEditTask(item); setDrawerOpen(true); }} />)}</div></div>)}</div>}
      </section>

      <TaskDrawer open={drawerOpen} task={editTask} onClose={() => { setDrawerOpen(false); setEditTask(undefined); }} />
    </div>
  );
}
