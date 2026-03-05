import { fetchApi } from './client';
import type { ServiceModule } from '../../types/supabase';

/**
 * Fetch all service modules
 */
export async function getServiceModules(): Promise<ServiceModule[]> {
  return await fetchApi('/api/service-modules');
}

/**
 * Fetch a single service module by ID
 */
export async function getServiceModuleById(id: string): Promise<ServiceModule | null> {
  return await fetchApi(`/api/service-modules/${id}`);
}

/**
 * Fetch a service module with all its pricing entries (enriched)
 */
export async function getServiceModuleWithPricing(id: string): Promise<ServiceModule> {
  return await fetchApi(`/api/service-modules/${id}/pricing`);
}

/**
 * Fetch all service modules with their pricing (enriched)
 */
export async function getServiceModulesWithPricing(): Promise<ServiceModule[]> {
  return await fetchApi('/api/service-modules/pricing');
}

/**
 * Create a new service module
 */
export async function createServiceModule(
  data: Omit<ServiceModule, 'id' | 'created_at'>
): Promise<ServiceModule> {
  return await fetchApi('/api/service-modules', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update a service module
 */
export async function updateServiceModule(
  id: string,
  updates: Partial<ServiceModule>
): Promise<ServiceModule> {
  return await fetchApi(`/api/service-modules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a service module (CASCADE deletes pricing entries)
 */
export async function deleteServiceModule(id: string): Promise<void> {
  await fetchApi(`/api/service-modules/${id}`, {
    method: 'DELETE',
  });
}

