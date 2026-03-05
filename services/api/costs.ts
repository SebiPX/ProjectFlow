import { fetchApi } from './client';
import type { Cost } from '../../types/supabase';

/**
 * Get all costs for a project
 */
export async function getCostsByProject(projectId: string): Promise<Cost[]> {
  return await fetchApi(`/api/projects/${projectId}/costs`);
}

/**
 * Get a single cost by ID
 */
export async function getCostById(id: string): Promise<Cost | null> {
  return await fetchApi(`/api/costs/${id}`);
}

/**
 * Create a new cost
 */
export async function createCost(
  costData: Omit<Cost, 'id' | 'created_at'>
): Promise<Cost> {
  return await fetchApi(`/api/costs`, {
    method: 'POST',
    body: JSON.stringify(costData),
  });
}

/**
 * Update an existing cost
 */
export async function updateCost(
  id: string,
  updates: Partial<Omit<Cost, 'id' | 'created_at'>>
): Promise<Cost> {
  return await fetchApi(`/api/costs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a cost
 */
export async function deleteCost(id: string): Promise<void> {
  await fetchApi(`/api/costs/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Upload cost invoice/receipt to storage
 * Returns the storage path (not URL)
 */
export async function uploadCostDocument(projectId: string, file: File): Promise<string> {
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

  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/cost-documents`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload document');
  }

  const data = await response.json();
  return data.path || data.url || '';
}

/**
 * Get signed URL for cost document
 */
export async function getCostDocumentSignedUrl(storagePath: string): Promise<string> {
  return await fetchApi(`/api/storage/signed-url?path=${encodeURIComponent(storagePath)}`)
    .then((res: any) => res.url || storagePath)
    .catch(() => storagePath);
}

/**
 * Delete cost document from storage
 */
export async function deleteCostDocument(storagePath: string): Promise<void> {
  try {
    await fetchApi(`/api/storage/delete`, {
      method: 'POST',
      body: JSON.stringify({ path: storagePath })
    });
  } catch (error) {
    console.error('Error deleting cost document:', error);
  }
}

/**
 * Calculate total costs for a project
 */
export async function calculateProjectCosts(projectId: string): Promise<number> {
  const costs = await getCostsByProject(projectId);
  return costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);
}

