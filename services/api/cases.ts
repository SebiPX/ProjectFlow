import { fetchApi } from './client';
import type { Case } from '../../types/supabase';

export async function getCases(): Promise<Case[]> {
  return await fetchApi('/api/agency/cases');
}

export async function getCase(id: string): Promise<Case> {
  return await fetchApi(`/api/agency/cases/${id}`);
}

export async function createCase(caseData: Partial<Case>): Promise<Case> {
  return await fetchApi('/api/agency/cases', {
    method: 'POST',
    body: JSON.stringify(caseData),
  });
}

export async function updateCase(id: string, updates: Partial<Case>): Promise<Case> {
  return await fetchApi(`/api/agency/cases/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteCase(id: string): Promise<void> {
  await fetchApi(`/api/agency/cases/${id}`, {
    method: 'DELETE',
  });
}
