import { fetchApi } from './client';
import type { Profile } from '../../types/supabase';

export interface WorkloadData {
  profile_id: string;
  profile: Profile;
  total_planned_minutes: number;
  total_planned_hours: number;
  weekly_capacity_hours: number;
  utilization_percentage: number;
  assigned_projects: number;
  assigned_tasks: number;
}

/**
 * Calculate workload for a specific user based on assigned tasks
 */
export async function getUserWorkload(userId: string): Promise<WorkloadData | null> {
  return await fetchApi(`/api/workload/users/${userId}`);
}

/**
 * Calculate workload for multiple users at once
 */
export async function getMultipleUsersWorkload(
  userIds: string[]
): Promise<Map<string, WorkloadData>> {
  const results = await fetchApi('/api/workload/users/batch', {
    method: 'POST',
    body: JSON.stringify({ userIds }),
  });
  
  // Convert object mapped by ID back to a Map
  return new Map(Object.entries(results));
}

/**
 * Calculate project workload - total planned hours for a project
 */
export async function getProjectWorkload(projectId: string): Promise<{
  total_planned_minutes: number;
  total_planned_hours: number;
  project_duration_weeks: number;
  weekly_effort_required: number;
}> {
  return await fetchApi(`/api/workload/projects/${projectId}`);
}

/**
 * Check if a user can be assigned to a project based on their current workload
 * Returns { canAssign: boolean, reason?: string }
 */
export async function canAssignUserToProject(
  userId: string,
  projectId: string,
  maxUtilizationPercent: number = 100
): Promise<{ canAssign: boolean; reason?: string; currentUtilization: number }> {
  try {
    const workload = await getUserWorkload(userId);
    const projectWorkload = await getProjectWorkload(projectId);

    if (!workload) {
      return {
        canAssign: false,
        reason: 'Could not calculate user workload',
        currentUtilization: 0,
      };
    }

    // Calculate potential new utilization if assigned to this project
    const additionalHoursPerWeek = projectWorkload.weekly_effort_required;
    const newTotalHours = workload.total_planned_hours + additionalHoursPerWeek;
    const newUtilizationPercentage = (newTotalHours / workload.weekly_capacity_hours) * 100;

    if (newUtilizationPercentage > maxUtilizationPercent) {
      return {
        canAssign: false,
        reason: `Would exceed capacity (${newUtilizationPercentage.toFixed(0)}% utilization)`,
        currentUtilization: workload.utilization_percentage,
      };
    }

    return {
      canAssign: true,
      currentUtilization: workload.utilization_percentage,
    };
  } catch (error: any) {
    console.error('Error checking if user can be assigned:', error);
    return {
      canAssign: false,
      reason: 'Error calculating workload',
      currentUtilization: 0,
    };
  }
}

