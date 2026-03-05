import { fetchApi } from './client';
import type { ProjectMember, Profile } from '../../types/supabase';

/**
 * Get all team members for a specific project
 */
export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  return await fetchApi(`/api/projects/${projectId}/members`);
}

/**
 * Get all internal users (admin, employee, freelancer) - not clients
 */
export async function getInternalUsers(): Promise<Profile[]> {
  return await fetchApi(`/api/profiles/internal`);
}

/**
 * Add a team member to a project
 */
export async function addProjectMember(
  memberData: Omit<ProjectMember, 'profile'>
): Promise<ProjectMember> {
  return await fetchApi(`/api/projects/${memberData.project_id}/members`, {
    method: 'POST',
    body: JSON.stringify(memberData),
  });
}

/**
 * Update a project member's role
 */
export async function updateProjectMember(
  projectId: string,
  profileId: string,
  role: string
): Promise<ProjectMember> {
  return await fetchApi(`/api/projects/${projectId}/members/${profileId}`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

/**
 * Remove a team member from a project
 */
export async function removeProjectMember(
  projectId: string,
  profileId: string
): Promise<void> {
  await fetchApi(`/api/projects/${projectId}/members/${profileId}`, {
    method: 'DELETE',
  });
}

