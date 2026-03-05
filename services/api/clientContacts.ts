import { fetchApi } from './client';
import type { ClientContact } from '../../types/supabase';

/**
 * Get all contacts for a specific client
 */
export async function getClientContacts(clientId: string): Promise<ClientContact[]> {
  return await fetchApi(`/api/client-contacts/client/${clientId}`);
}

/**
 * Get a single contact by ID
 */
export async function getClientContactById(id: string): Promise<ClientContact | null> {
  return await fetchApi(`/api/client-contacts/${id}`);
}

/**
 * Create a new client contact
 */
export async function createClientContact(
  contactData: Omit<ClientContact, 'id' | 'created_at'>
): Promise<ClientContact> {
  return await fetchApi(`/api/client-contacts`, {
    method: 'POST',
    body: JSON.stringify(contactData),
  });
}

/**
 * Update an existing client contact
 */
export async function updateClientContact(
  id: string,
  updates: Partial<Omit<ClientContact, 'id' | 'created_at' | 'client_id'>>
): Promise<ClientContact> {
  return await fetchApi(`/api/client-contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a client contact
 */
export async function deleteClientContact(id: string): Promise<void> {
  await fetchApi(`/api/client-contacts/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Set a contact as primary (and unset others)
 */
export async function setPrimaryContact(clientId: string, contactId: string): Promise<void> {
  await fetchApi(`/api/client-contacts/${contactId}`, {
    method: 'PUT',
    body: JSON.stringify({ is_primary: true, client_id: clientId }),
  });
}

