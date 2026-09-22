import { Task, Category, AppSettings } from "@/types";
import { storageGet, storageSet } from "./storage";
import { STORAGE_KEYS } from "./keys";

export function loadTasks(): Task[] {
  return storageGet<Task[]>(STORAGE_KEYS.TASKS) ?? [];
}

export function saveTasks(tasks: Task[]): void {
  storageSet(STORAGE_KEYS.TASKS, tasks);
}

export function loadSettings(): AppSettings {
  return (
    storageGet<AppSettings>(STORAGE_KEYS.SETTINGS) ?? {
      sortMode: "recommended",
      defaultPriority: "medium",
      showCompletedInList: false,
      focusTaskCount: 4,
    }
  );
}

export function saveSettings(settings: AppSettings): void {
  storageSet(STORAGE_KEYS.SETTINGS, settings);
}

export function loadCategories(): Category[] {
  return (
    storageGet<Category[]>(STORAGE_KEYS.CATEGORIES) ?? [
      { id: "work", name: "Work", color: "#7c6dfa" },
      { id: "personal", name: "Personal", color: "#22c55e" },
      { id: "learning", name: "Learning", color: "#f97316" },
    ]
  );
}

export function saveCategories(categories: Category[]): void {
  storageSet(STORAGE_KEYS.CATEGORIES, categories);
}
