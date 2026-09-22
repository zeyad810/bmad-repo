import { Task, TaskPriority } from "@/types";
import { differenceInDays, parseISO, isValid } from "date-fns";

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  critical: 10,
  high: 7,
  medium: 4,
  low: 1,
};

function getDueDatePressure(dueDate?: string): number {
  if (!dueDate) return 0;
  try {
    const due = parseISO(dueDate);
    if (!isValid(due)) return 0;
    const daysUntilDue = differenceInDays(due, new Date());
    if (daysUntilDue < 0) return 10; // overdue
    if (daysUntilDue === 0) return 8; // due today
    if (daysUntilDue <= 1) return 6;
    if (daysUntilDue <= 3) return 4;
    if (daysUntilDue <= 7) return 2;
    return 0;
  } catch {
    return 0;
  }
}

function getDependencyWeight(task: Task, allTasks: Task[]): number {
  if (task.dependencies.length === 0) return 0;
  const hasBlockedDep = task.dependencies.some((depId) => {
    const dep = allTasks.find((t) => t.id === depId);
    return dep && dep.status !== "completed";
  });
  // If blocked by incomplete dependencies, reduce score
  return hasBlockedDep ? -15 : 0;
}

export function calculatePriorityScore(task: Task, allTasks: Task[]): number {
  const score =
    task.importance +
    task.urgency +
    getDueDatePressure(task.dueDate) +
    PRIORITY_WEIGHT[task.priority] +
    getDependencyWeight(task, allTasks);
  return Math.max(0, score);
}

export function isBlocked(task: Task, allTasks: Task[]): boolean {
  if (task.dependencies.length === 0) return false;
  return task.dependencies.some((depId) => {
    const dep = allTasks.find((t) => t.id === depId);
    return dep && dep.status !== "completed";
  });
}

export function getBlockedBy(task: Task, allTasks: Task[]): Task[] {
  return task.dependencies
    .map((id) => allTasks.find((t) => t.id === id))
    .filter((t): t is Task => !!t && t.status !== "completed");
}
