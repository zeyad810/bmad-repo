export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export function createTaskFactory(overrides: Partial<Task> = {}): Task {
  const id = `task-${Math.random().toString(36).substring(2, 9)}`;
  return {
    id,
    title: `Test Task ${id}`,
    description: 'Automated test task description',
    status: 'todo',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}
