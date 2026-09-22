export type TaskStatus = "backlog" | "next" | "in-progress" | "completed";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type SortMode =
  | "recommended"
  | "manual"
  | "priority"
  | "due-date"
  | "estimated-time"
  | "importance"
  | "urgency";

export type ViewMode = "dashboard" | "today" | "focus" | "tasks" | "matrix" | "completed";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  importance: number; // 1-10
  urgency: number; // 1-10
  priorityScore: number;
  dueDate?: string; // ISO date string
  estimatedMinutes?: number;
  category?: string;
  tags: string[];
  position: number;
  isPinned: boolean;
  dependencies: string[]; // task IDs
  createdAt: string; // ISO datetime
  completedAt?: string; // ISO datetime
  previousStatus?: TaskStatus;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface AppSettings {
  sortMode: SortMode;
  defaultPriority: TaskPriority;
  showCompletedInList: boolean;
  focusTaskCount: number; // how many tasks to show in focus mode's "up next"
}
