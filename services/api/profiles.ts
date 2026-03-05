import { fetchApi } from './client';
import type { Profile } from '../../types/supabase';

/**
 * Get all profiles (users/team members)
 */
export async function getProfiles(): Promise<Profile[]> {
  return await fetchApi('/api/profiles');
}

/**
 * Get a single profile by ID
 */
export async function getProfileById(id: string): Promise<Profile | null> {
  return await fetchApi(`/api/profiles/${id}`);
}

/**
 * Update a profile
 */
export async function updateProfile(
  id: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at'>>
): Promise<Profile> {
  return await fetchApi(`/api/profiles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Get profiles by role
 */
export async function getProfilesByRole(
  role: 'admin' | 'employee' | 'freelancer' | 'client'
): Promise<Profile[]> {
  return await fetchApi(`/api/profiles?role=${role}`);
}

/**
 * Get all internal team members (admin, employee, freelancer)
 * Full access (Admins only via Roles usually)
 */
export async function getInternalProfiles(): Promise<Profile[]> {
  return await fetchApi('/api/profiles/internal');
}

/**
 * Get secure team directory (For non-admins)
 */
export async function getTeamDirectory(): Promise<Profile[]> {
  return await fetchApi('/api/team-directory');
}

