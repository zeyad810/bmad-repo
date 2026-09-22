"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ListTodo, Trash2 } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { useCompletedTasks } from "@/hooks/useTasks";
import { useTaskStore } from "@/stores/task-store";
import { Task } from "@/types";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskDrawer } from "@/components/tasks/TaskDrawer";

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

  function handleClearAll() {
    if (confirm("Are you sure you want to delete all completed tasks? This cannot be undone.")) completedTasks.forEach((task) => deleteTask(task.id));
  }

  return (
    <div className="space-y-7 lg:space-y-9">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-200"><ArrowLeft size={14} /> Back to my tasks</Link>
          <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Archive</p>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">Completed work.</h1>
          <p className="mt-2 text-sm text-zinc-500">A record of the things you have moved forward.</p>
        </div>
        {completedTasks.length > 0 && <button type="button" onClick={handleClearAll} className="inline-flex w-fit items-center gap-2 rounded-xl border border-rose-400/15 bg-rose-400/[0.07] px-3 py-2.5 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-400/[0.13]"><Trash2 size={14} /> Clear archive</button>}
      </section>

      <section className="surface-panel p-4 sm:p-6">
        <div className="mb-5 flex items-center gap-2 border-b border-white/[0.07] pb-5"><CheckCircle2 size={18} className="text-emerald-400" /><h2 className="text-lg font-semibold tracking-tight text-white">All completed</h2><span className="rounded-md bg-emerald-400/10 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-300">{completedTasks.length}</span></div>
        {completedTasks.length === 0 ? <div className="empty-state py-12"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300"><ListTodo size={23} /></div><h3 className="text-sm font-semibold text-zinc-200">Nothing here yet</h3><p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-600">Finished tasks will collect here as you make progress.</p><Link href="/" className="mt-5 text-xs font-semibold text-amber-300 hover:text-amber-200">View active tasks <span aria-hidden="true">→</span></Link></div> : <div className="space-y-7">{Object.entries(groups).map(([dateLabel, tasksInGroup]) => <div key={dateLabel}><div className="mb-3 flex items-center gap-3"><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">{dateLabel}</span><div className="h-px flex-1 bg-white/[0.07]" /></div><div className="space-y-3">{tasksInGroup.map((task, index) => <TaskCard key={task.id} task={task} index={index} showDragHandle={false} onEdit={(item) => { setEditTask(item); setDrawerOpen(true); }} />)}</div></div>)}</div>}
      </section>

      <TaskDrawer open={drawerOpen} task={editTask} onClose={() => { setDrawerOpen(false); setEditTask(undefined); }} />
    </div>
  );
}
