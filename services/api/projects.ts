import { fetchApi } from './client';
import type { Project } from '../../types/supabase';

/**
 * Get all projects with client data and team members
 */
export async function getProjects(): Promise<Project[]> {
  return await fetchApi('/api/projects');
}

/**
 * Get a single project by ID with all related data
 */
export async function getProjectById(id: string): Promise<Project | null> {
  return await fetchApi(`/api/projects/${id}`);
}

/**
 * Create a new project
 */
export async function createProject(
  projectData: Omit<Project, 'id' | 'created_at' | 'project_number' | 'client'>
): Promise<Project> {
  return await fetchApi('/api/projects', {
    method: 'POST',
    body: JSON.stringify(projectData),
  });
}

/**
 * Update an existing project
 */
export async function updateProject(
  id: string,
  updates: Partial<Omit<Project, 'id' | 'created_at' | 'project_number' | 'client'>>
): Promise<Project> {
  return await fetchApi(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
  await fetchApi(`/api/projects/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Archive or unarchive a project
 */
export async function archiveProject(id: string, is_archived: boolean): Promise<Project> {
  return await fetchApi(`/api/projects/${id}/archive`, {
    method: 'PATCH',
    body: JSON.stringify({ is_archived }),
  });
}

/**
 * Get project statistics for dashboard
 */
export async function getProjectStats() {
  return await fetchApi('/api/projects/stats');
}

/**
 * Get projects by status
 */
export async function getProjectsByStatus(
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled'
): Promise<Project[]> {
  return await fetchApi(`/api/projects?status=${status}`);
}

/**
 * Get financial overview for all projects
 * Returns costs and billable value for each project
 */
export async function getProjectsFinancialOverview(): Promise<Record<string, { costs: number; billableValue: number; total: number }>> {
  return await fetchApi('/api/projects/financial-overview');
}

