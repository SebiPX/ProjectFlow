import { fetchApi } from './client';
import type { SeniorityLevel } from '../../types/supabase';

/**
 * Fetch all seniority levels, ordered by level_order
 */
export async function getSeniorityLevels(): Promise<SeniorityLevel[]> {
  return await fetchApi('/api/seniority-levels');
}

/**
 * Fetch a single seniority level by ID
 */
export async function getSeniorityLevelById(id: string): Promise<SeniorityLevel | null> {
  return await fetchApi(`/api/seniority-levels/${id}`);
}

/**
 * Create a new seniority level
 */
export async function createSeniorityLevel(
  data: Omit<SeniorityLevel, 'id' | 'created_at'>
): Promise<SeniorityLevel> {
  return await fetchApi('/api/seniority-levels', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update a seniority level
 */
export async function updateSeniorityLevel(
  id: string,
  updates: Partial<SeniorityLevel>
): Promise<SeniorityLevel> {
  return await fetchApi(`/api/seniority-levels/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a seniority level (CASCADE deletes pricing entries)
 */
export async function deleteSeniorityLevel(id: string): Promise<void> {
  await fetchApi(`/api/seniority-levels/${id}`, {
    method: 'DELETE',
  });
}

