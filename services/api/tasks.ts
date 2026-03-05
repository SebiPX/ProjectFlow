import { fetchApi } from './client';
import type { Task } from '../../types/supabase';
import { TaskStatus } from '../../types/supabase';

/**
 * Get all tasks with assignee and project data
 */
export async function getTasks(): Promise<Task[]> {
  return await fetchApi('/api/tasks');
}

/**
 * Get tasks by project ID
 */
export async function getTasksByProject(projectId: string): Promise<Task[]> {
  return await fetchApi(`/api/projects/${projectId}/tasks`);
}

/**
 * Get a single task by ID
 */
export async function getTaskById(id: string): Promise<Task | null> {
  return await fetchApi(`/api/tasks/${id}`);
}

/**
 * Create a new task
 */
export async function createTask(
  taskData: Omit<Task, 'id' | 'created_at' | 'assignee'>
): Promise<Task> {
  return await fetchApi('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

/**
 * Update an existing task
 */
export async function updateTask(
  id: string,
  updates: Partial<Omit<Task, 'id' | 'created_at' | 'assignee'>>
): Promise<Task> {
  return await fetchApi(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<void> {
  await fetchApi(`/api/tasks/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Update task status (useful for Kanban board)
 */
export async function updateTaskStatus(
  id: string,
  status: TaskStatus
): Promise<Task> {
  return updateTask(id, { status });
}

/**
 * Get tasks by status
 */
export async function getTasksByStatus(
  projectId: string,
  status: TaskStatus
): Promise<Task[]> {
  return await fetchApi(`/api/projects/${projectId}/tasks?status=${encodeURIComponent(status)}`);
}

