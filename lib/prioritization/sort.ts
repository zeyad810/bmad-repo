import { Task, SortMode } from "@/types";
import { parseISO, isValid } from "date-fns";

function safeParse(dateStr?: string): number {
  if (!dateStr) return Infinity;
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? d.getTime() : Infinity;
  } catch {
    return Infinity;
  }
}

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export function sortTasks(tasks: Task[], mode: SortMode): Task[] {
  const copy = [...tasks];

  switch (mode) {
    case "recommended":
      return copy.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.priorityScore - a.priorityScore;
      });

    case "manual":
      return copy.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return a.position - b.position;
      });

    case "priority":
      return copy.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      });

    case "due-date":
      return copy.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return safeParse(a.dueDate) - safeParse(b.dueDate);
      });

    case "estimated-time":
      return copy.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return (a.estimatedMinutes ?? Infinity) - (b.estimatedMinutes ?? Infinity);
      });

    case "importance":
      return copy.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.importance - a.importance;
      });

    case "urgency":
      return copy.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.urgency - a.urgency;
      });

    default:
      return copy;
  }
}
