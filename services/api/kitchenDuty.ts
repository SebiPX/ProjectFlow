import { fetchApi } from './client';

export interface WeekDuty {
  weekNumber: number;
  year: number;
  assignedIds: string[];
}

export interface KitchenDutyData {
  duties: WeekDuty[];
  participants: string[];
}

/**
 * Get all kitchen duties and participants from the database
 */
export async function getKitchenDutyData(): Promise<KitchenDutyData> {
  return await fetchApi('/api/kitchen-duty');
}

/**
 * Save all weekly kitchen duties to the database
 */
export async function saveKitchenDuties(duties: WeekDuty[]): Promise<{ success: boolean }> {
  return await fetchApi('/api/kitchen-duty/duties', {
    method: 'POST',
    body: JSON.stringify({ duties }),
  });
}

/**
 * Save the list of active kitchen duty participant IDs to the database
 */
export async function saveKitchenParticipants(participantIds: string[]): Promise<{ success: boolean }> {
  return await fetchApi('/api/kitchen-duty/participants', {
    method: 'POST',
    body: JSON.stringify({ participantIds }),
  });
}
