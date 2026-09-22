"use client";

import { useMemo } from "react";
import { useTaskStore } from "@/stores/task-store";
import { Task } from "@/types";
import { sortTasks } from "@/lib/prioritization/sort";
import { isToday, isPast, parseISO, isValid } from "date-fns";

export function useTasks() {
  return useTaskStore((s) => s.tasks);
}

export function useSortedTasks() {
  const tasks = useTaskStore((s) => s.tasks);
  const sortMode = useTaskStore((s) => s.settings.sortMode);

  return useMemo(() => {
    const active = tasks.filter((t) => t.status !== "completed");
    return sortTasks(active, sortMode);
  }, [tasks, sortMode]);
}

export function useRecommendedTasks() {
  const tasks = useTaskStore((s) => s.tasks);
  return useMemo(() => {
    return sortTasks(
      tasks.filter((t) => t.status !== "completed"),
      "recommended"
    );
  }, [tasks]);
}

export function isTodayTask(task: Task): boolean {
  if (task.status === "completed") return false;
  if (task.status === "in-progress") return true;
  if (task.status === "next") return true;
  if (task.dueDate) {
    try {
      const d = parseISO(task.dueDate);
      if (isValid(d) && (isToday(d) || isPast(d))) return true;
    } catch {
      //
    }
  }
  return false;
}

export function useTodayTasks() {
  const tasks = useTaskStore((s) => s.tasks);
  return useMemo(() => tasks.filter(isTodayTask), [tasks]);
}

export function useTodaySectionTasks() {
  const activeTasks = useSortedTasks();
  return useMemo(() => activeTasks.filter(isTodayTask), [activeTasks]);
}

export function useBacklogSectionTasks() {
  const activeTasks = useSortedTasks();
  return useMemo(() => activeTasks.filter((t) => !isTodayTask(t)), [activeTasks]);
}

export function useCompletedTasks() {
  const tasks = useTaskStore((s) => s.tasks);
  return useMemo(
    () =>
      tasks
        .filter((t) => t.status === "completed")
        .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")),
    [tasks]
  );
}

export function useStats() {
  const tasks = useTaskStore((s) => s.tasks);
  return useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const completedToday = tasks.filter(
      (t) =>
        t.status === "completed" &&
        t.completedAt &&
        new Date(t.completedAt) >= todayStart
    ).length;

    const overdue = tasks.filter((t) => {
      if (t.status === "completed") return false;
      if (!t.dueDate) return false;
      try {
        const d = parseISO(t.dueDate);
        return isValid(d) && isPast(d) && !isToday(d);
      } catch {
        return false;
      }
    }).length;

    const active = tasks.filter((t) => t.status !== "completed");
    const critical = active.filter((t) => t.priority === "critical").length;
    const estimatedRemaining = active.reduce(
      (sum, t) => sum + (t.estimatedMinutes ?? 0),
      0
    );
    const total = tasks.length;
    const completedAll = tasks.filter((t) => t.status === "completed").length;

    return {
      total,
      completedAll,
      completedToday,
      overdue,
      critical,
      estimatedRemaining,
      active: active.length,
    };
  }, [tasks]);
}
