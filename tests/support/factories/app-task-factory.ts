import type { Page } from '@playwright/test';
import type { Task } from '@/types';

let taskSequence = 0;

export function createAppTask(overrides: Partial<Task> = {}): Task {
  taskSequence += 1;
  return {
    id: `e2e-task-${taskSequence}`,
    title: `E2E task ${taskSequence}`,
    status: 'next',
    priority: 'medium',
    importance: 5,
    urgency: 5,
    priorityScore: 0,
    tags: [],
    position: taskSequence - 1,
    isPinned: false,
    dependencies: [],
    createdAt: new Date(2026, 0, taskSequence).toISOString(),
    ...overrides,
  };
}

export async function seedTasks(page: Page, tasks: Task[]): Promise<void> {
  await page.goto('/');
  await page.evaluate((seededTasks) => {
    localStorage.setItem('task-manager:tasks', JSON.stringify(seededTasks));
  }, tasks);
  await page.reload();
}
