import { fetchApi } from './client';
import type { ServicePricing } from '../../types/supabase';

/**
 * Fetch all service pricing entries
 */
export async function getServicePricing(): Promise<ServicePricing[]> {
  return await fetchApi('/api/service-pricing');
}

/**
 * Fetch pricing entries for a specific service module
 */
export async function getPricingByServiceModule(serviceModuleId: string): Promise<ServicePricing[]> {
  return await fetchApi(`/api/service-modules/${serviceModuleId}/pricing-entries`);
}

/**
 * Fetch a single pricing entry by ID
 */
export async function getPricingById(id: string): Promise<ServicePricing | null> {
  return await fetchApi(`/api/service-pricing/${id}`);
}

/**
 * Create a new pricing entry
 */
export async function createServicePricing(
  data: Omit<ServicePricing, 'id' | 'created_at' | 'margin_percentage'>
): Promise<ServicePricing> {
  return await fetchApi('/api/service-pricing', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update a pricing entry
 */
export async function updateServicePricing(
  id: string,
  updates: Partial<Omit<ServicePricing, 'margin_percentage'>>
): Promise<ServicePricing> {
  return await fetchApi(`/api/service-pricing/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a pricing entry
 */
export async function deleteServicePricing(id: string): Promise<void> {
  await fetchApi(`/api/service-pricing/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Batch create multiple pricing entries
 */
export async function createMultiplePricings(
  pricings: Omit<ServicePricing, 'id' | 'created_at' | 'margin_percentage'>[]
): Promise<ServicePricing[]> {
  return await fetchApi('/api/service-pricing/batch', {
    method: 'POST',
    body: JSON.stringify({ pricings }),
  });
}

/**
 * Batch update multiple pricing entries
 */
export async function updateMultiplePricings(
  updates: { id: string; data: Partial<Omit<ServicePricing, 'margin_percentage'>> }[]
): Promise<ServicePricing[]> {
  return await fetchApi('/api/service-pricing/batch', {
    method: 'PUT',
    body: JSON.stringify({ updates }),
  });
}

/**
 * Delete all pricing entries for a service module
 */
export async function deletePricingByServiceModule(serviceModuleId: string): Promise<void> {
  await fetchApi(`/api/service-modules/${serviceModuleId}/pricing-entries`, {
    method: 'DELETE',
  });
}

