/// <reference types="vite/client" />
import { fetchApi } from './client';
import type { Profile } from '../../types/supabase';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Upload avatar image to API Storage
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const sessionStr = localStorage.getItem('agency_session');
  const headers: Record<string, string> = {};
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } catch (e) {}
  }

  const response = await fetch(`${API_URL}/api/storage/avatars`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload avatar');
  }

  const data = await response.json();
  return data.path || data.url || '';
}

/**
 * Update user profile with new avatar storage path
 */
export async function updateAvatarPath(
  userId: string,
  storagePath: string
): Promise<Profile> {
  return await fetchApi(`/api/profiles/${userId}/avatar`, {
    method: 'PUT',
    body: JSON.stringify({ avatar_url: storagePath }),
  });
}

/**
 * Change user password
 */
export async function changePassword(
  newPassword: string
): Promise<void> {
  await fetchApi('/auth/password', {
    method: 'PATCH',
    body: JSON.stringify({ new_password: newPassword, current_password: 'prompt_user_for_this' }), // Note: frontend might need update to provide current password
  });
}

/**
 * Admin: Change another user's password
 */
export async function adminResetPassword(
  userId: string,
  newPassword: string
): Promise<void> {
  await fetchApi('/auth/admin/reset-password', {
    method: 'PATCH',
    body: JSON.stringify({ user_id: userId, new_password: newPassword }),
  });
}

/**
 * Update user profile information
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    full_name?: string;
    email?: string;
  }
): Promise<Profile> {
  return await fetchApi(`/api/profiles/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete old avatar from storage
 */
export async function deleteOldAvatar(storagePath: string): Promise<void> {
  try {
    await fetchApi(`/api/storage/delete`, {
      method: 'POST',
      body: JSON.stringify({ path: storagePath })
    });
  } catch (error) {
    console.warn('Error deleting old avatar:', error);
  }
}

/**
 * Get signed URL for avatar (valid for 1 hour)
 */
export async function getAvatarSignedUrl(storagePath: string): Promise<string> {
  return await fetchApi(`/api/storage/signed-url?path=${encodeURIComponent(storagePath)}`)
    .then((res: any) => res.url || storagePath)
    .catch(() => storagePath);
}

