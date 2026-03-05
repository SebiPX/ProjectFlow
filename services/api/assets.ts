import { fetchApi } from './client';
import type { Asset } from '../../types/supabase';

/**
 * Get all assets with uploader and project data
 */
export async function getAssets(): Promise<Asset[]> {
  return await fetchApi('/api/assets');
}

/**
 * Get assets by project ID
 */
export async function getAssetsByProject(projectId: string): Promise<Asset[]> {
  return await fetchApi(`/api/projects/${projectId}/assets`);
}

/**
 * Get a single asset by ID
 */
export async function getAssetById(id: string): Promise<Asset | null> {
  return await fetchApi(`/api/assets/${id}`);
}

/**
 * Upload a file to API Storage and create asset record
 */
export async function uploadAsset(
  file: File,
  metadata: Omit<Asset, 'id' | 'created_at' | 'uploader' | 'storage_path' | 'file_size' | 'file_type'>
): Promise<Asset> {
  const formData = new FormData();
  formData.append('file', file);
  
  // Append metadata
  Object.entries(metadata).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value.toString());
    }
  });

  const sessionStr = localStorage.getItem('agency_session');
  const headers: Record<string, string> = {};
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } catch (e) {}
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/assets`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload asset');
  }

  return response.json();
}

/**
 * Update asset metadata
 */
export async function updateAsset(
  id: string,
  updates: Partial<Omit<Asset, 'id' | 'created_at' | 'uploader' | 'storage_path' | 'file_size' | 'file_type'>>
): Promise<Asset> {
  return await fetchApi(`/api/assets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete an asset (removes file from storage and database record)
 */
export async function deleteAsset(id: string): Promise<void> {
  await fetchApi(`/api/assets/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Get public URL for an asset file
 * Note: Returns a public URL. If the bucket is not public, use getAssetSignedUrl instead.
 */
export function getAssetUrl(storagePath: string): string {
  // Static cdn url strategy
  const baseUrl = import.meta.env.VITE_PUBLIC_STORAGE_URL || import.meta.env.VITE_API_URL;
  return `${baseUrl}/${storagePath}`;
}

/**
 * Get a signed URL for an asset file (works even if bucket is not public)
 * URL is valid for 1 hour
 */
export async function getAssetSignedUrl(storagePath: string): Promise<string> {
  return await fetchApi(`/api/storage/signed-url?path=${encodeURIComponent(storagePath)}`)
    .then((res: any) => res.url || storagePath)
    .catch(() => storagePath);
}

/**
 * Download an asset file
 */
export async function downloadAsset(storagePath: string, fileName: string): Promise<void> {
  try {
    const url = await getAssetSignedUrl(storagePath);
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    
    // Create download link
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(objectUrl);
  } catch (error: any) {
    throw new Error(`Failed to download asset: ${error.message}`);
  }
}

