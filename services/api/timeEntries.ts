import { fetchApi } from './client';
import type { TimeEntry } from '../../types/supabase';

/**
 * Get all time entries with profile data
 */
export async function getTimeEntries(): Promise<TimeEntry[]> {
  return await fetchApi('/api/time-entries');
}

/**
 * Get all submitted time entries (for approval)
 */
export async function getSubmittedTimeEntries(): Promise<TimeEntry[]> {
  return await fetchApi('/api/time-entries/submitted');
}

/**
 * Approve multiple time entries
 */
export async function approveTimeEntries(ids: string[]): Promise<void> {
  await fetchApi('/api/time-entries/approve-batch', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

/**
 * Reject a time entry with reason
 */
export async function rejectTimeEntry(id: string, reason: string): Promise<void> {
  await fetchApi(`/api/time-entries/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

/**
 * Get time entries by project ID
 */
export async function getTimeEntriesByProject(
  projectId: string
): Promise<TimeEntry[]> {
  return await fetchApi(`/api/projects/${projectId}/time-entries`);
}

/**
 * Get time entries by profile ID
 */
export async function getTimeEntriesByProfile(
  profileId: string
): Promise<TimeEntry[]> {
  return await fetchApi(`/api/profiles/${profileId}/time-entries`);
}

/**
 * Get time entries by task ID
 */
export async function getTimeEntriesByTask(
  taskId: string
): Promise<TimeEntry[]> {
  return await fetchApi(`/api/tasks/${taskId}/time-entries`);
}

/**
 * Get a single time entry by ID
 */
export async function getTimeEntryById(id: string): Promise<TimeEntry | null> {
  return await fetchApi(`/api/time-entries/${id}`);
}

/**
 * Create a new time entry
 */
export async function createTimeEntry(
  timeEntryData: Omit<TimeEntry, 'id' | 'created_at' | 'profile'>
): Promise<TimeEntry> {
  return await fetchApi('/api/time-entries', {
    method: 'POST',
    body: JSON.stringify(timeEntryData),
  });
}

/**
 * Update an existing time entry
 */
export async function updateTimeEntry(
  id: string,
  updates: Partial<Omit<TimeEntry, 'id' | 'created_at' | 'profile'>>
): Promise<TimeEntry> {
  return await fetchApi(`/api/time-entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a time entry
 */
export async function deleteTimeEntry(id: string): Promise<void> {
  await fetchApi(`/api/time-entries/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Get total tracked hours for a project
 */
export async function getTotalProjectHours(projectId: string): Promise<number> {
  const result = await fetchApi(`/api/projects/${projectId}/hours`);
  return result.totalHours || 0;
}

/**
 * Get time entries statistics for dashboard
 */
export async function getTimeEntriesStats() {
  return await fetchApi('/api/time-entries/stats');
}

/**
 * Calculate billable hours value for a project
 * Returns total value based on billable hours × hourly rate
 */
export async function calculateProjectBillableValue(projectId: string): Promise<{
  totalHours: number;
  billableHours: number;
  totalValue: number;
}> {
  return await fetchApi(`/api/projects/${projectId}/billable-value`);
}

