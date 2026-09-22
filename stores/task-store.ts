import { create } from "zustand";
import { Task, Category, AppSettings, SortMode, TaskPriority, TaskStatus } from "@/types";
import {
  loadTasks,
  saveTasks,
  loadSettings,
  saveSettings,
  loadCategories,
  saveCategories,
} from "@/lib/storage/task-storage";
import { calculatePriorityScore } from "@/lib/prioritization/score";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function recalcScores(tasks: Task[]): Task[] {
  return tasks.map((t) => ({
    ...t,
    priorityScore: calculatePriorityScore(t, tasks),
  }));
}

interface TaskStore {
  tasks: Task[];
  settings: AppSettings;
  categories: Category[];
  hydrated: boolean;

  // Lifecycle
  hydrate: () => void;

  // Task CRUD
  addTask: (data: Omit<Task, "id" | "priorityScore" | "createdAt" | "position">) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, "id" | "createdAt">>) => void;
  deleteTask: (id: string) => void;

  // Ordering
  reorderTasks: (orderedIds: string[]) => void;
  moveTask: (id: string, newStatus: TaskStatus, orderedIds: string[]) => void;

  // Status
  setStatus: (id: string, status: TaskStatus) => void;
  togglePin: (id: string) => void;

  // Settings
  setSortMode: (mode: SortMode) => void;
  setPriority: (id: string, priority: TaskPriority) => void;

  // Categories
  addCategory: (name: string, color: string) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  settings: {
    sortMode: "recommended",
    defaultPriority: "medium",
    showCompletedInList: false,
    focusTaskCount: 4,
  },
  categories: [],
  hydrated: false,

  hydrate() {
    if (get().hydrated) return;
    const tasks = loadTasks();
    const settings = loadSettings();
    const categories = loadCategories();
    const withScores = recalcScores(tasks);
    set({ tasks: withScores, settings, categories, hydrated: true });
  },

  addTask(data) {
    const { tasks } = get();
    const newTask: Task = {
      ...data,
      id: generateId(),
      priorityScore: 0,
      createdAt: new Date().toISOString(),
      position: tasks.length,
    };
    const updated = recalcScores([...tasks, newTask]);
    set({ tasks: updated });
    saveTasks(updated);
  },

  updateTask(id, updates) {
    const { tasks } = get();
    const updated = recalcScores(
      tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    set({ tasks: updated });
    saveTasks(updated);
  },

  deleteTask(id) {
    const { tasks } = get();
    // Remove id from other tasks' dependencies
    const updated = tasks
      .filter((t) => t.id !== id)
      .map((t) => ({
        ...t,
        dependencies: t.dependencies.filter((d) => d !== id),
      }));
    const withScores = recalcScores(updated);
    set({ tasks: withScores });
    saveTasks(withScores);
  },

  reorderTasks(orderedIds) {
    const { tasks } = get();
    const positionMap = new Map(orderedIds.map((id, i) => [id, i]));
    const updated = tasks.map((t) => ({
      ...t,
      position: positionMap.has(t.id) ? positionMap.get(t.id)! : t.position,
    }));
    set({ tasks: updated });
    saveTasks(updated);
  },

  moveTask(id, newStatus, orderedIds) {
    const { tasks } = get();
    const movedTask = tasks.find((t) => t.id === id);
    if (!movedTask) return;

    const sourceStatus = movedTask.status;
    const destPositionMap = new Map(orderedIds.map((tid, i) => [tid, i]));

    // Renumber source section tasks (excluding moved task) to remove gaps
    const sourceTaskIds = tasks
      .filter((t) => t.status === sourceStatus && t.id !== id)
      .map((t) => t.id);
    const sourcePositionMap = new Map(sourceTaskIds.map((tid, i) => [tid, i]));

    const updated = recalcScores(
      tasks.map((t) => {
        if (t.id === id) {
          return { ...t, status: newStatus, position: destPositionMap.get(t.id)! };
        } else if (t.status === sourceStatus) {
          return { ...t, position: sourcePositionMap.get(t.id)! };
        } else {
          return { ...t, position: destPositionMap.get(t.id) ?? t.position };
        }
      })
    );
    set({ tasks: updated });
    saveTasks(updated);
  },

  setStatus(id, status) {
    const { tasks } = get();
    const updated = recalcScores(
      tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              previousStatus: status === "completed" ? t.status : undefined,
              completedAt: status === "completed" ? new Date().toISOString() : undefined,
            }
          : t
      )
    );
    set({ tasks: updated });
    saveTasks(updated);
  },

  togglePin(id) {
    const { tasks } = get();
    const updated = tasks.map((t) => (t.id === id ? { ...t, isPinned: !t.isPinned } : t));
    set({ tasks: updated });
    saveTasks(updated);
  },

  setSortMode(mode) {
    const { settings } = get();
    const updated = { ...settings, sortMode: mode };
    set({ settings: updated });
    saveSettings(updated);
  },

  setPriority(id, priority) {
    const { tasks } = get();
    const updated = recalcScores(
      tasks.map((t) => (t.id === id ? { ...t, priority } : t))
    );
    set({ tasks: updated });
    saveTasks(updated);
  },

  addCategory(name, color) {
    const { categories } = get();
    const updated = [...categories, { id: generateId(), name, color }];
    set({ categories: updated });
    saveCategories(updated);
  },
}));
