import { fetchApi } from './client';
import type { TaskVariance, ProjectServiceBreakdown } from '../../types/supabase';

/**
 * Calculate variance for a single task (Plan vs Actual)
 * Compares estimated hours/costs with actual tracked time from time_entries
 *
 * @param taskId - The task ID
 * @returns Variance data with planned, actual, and delta (or null if task has no service tracking)
 */
export async function calculateTaskVariance(taskId: string): Promise<TaskVariance | null> {
  return await fetchApi(`/api/tasks/${taskId}/variance`);
}

/**
 * Calculate variances for all tasks in a project
 * Only includes tasks with service tracking (service_module_id not null)
 *
 * @param projectId - The project ID
 * @returns Array of task variances (only tasks with service tracking)
 */
export async function calculateProjectTaskVariances(
  projectId: string
): Promise<TaskVariance[]> {
  return await fetchApi(`/api/projects/${projectId}/task-variances`);
}

/**
 * Get service breakdown for a project (aggregated by service module + seniority level)
 * Groups tasks by their service and calculates total Plan vs Actual for each service
 *
 * @param projectId - The project ID
 * @returns Service breakdown with Plan vs Actual aggregates
 */
export async function getProjectServiceBreakdown(
  projectId: string
): Promise<ProjectServiceBreakdown[]> {
  return await fetchApi(`/api/projects/${projectId}/service-breakdown`);
}

/**
 * Get pricing rate for a specific service module + seniority level combination
 * Helper function for auto-filling estimated_rate in UI
 *
 * @param serviceModuleId - The service module ID
 * @param seniorityLevelId - The seniority level ID
 * @returns The rate (€/hour) or null if not found
 */
export async function getServicePricingRate(
  serviceModuleId: string,
  seniorityLevelId: string
): Promise<number | null> {
  try {
    const result = await fetchApi(`/api/service-pricing/rate?moduleId=${encodeURIComponent(serviceModuleId)}&levelId=${encodeURIComponent(seniorityLevelId)}`);
    return result.rate || null;
  } catch (error) {
    console.error('Error fetching service pricing rate:', error);
    return null;
  }
}

