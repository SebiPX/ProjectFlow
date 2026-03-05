import { fetchApi } from './client';
import type { Profile } from '../../types/supabase';

export interface ResourceAllocation {
    date: string; // YYYY-MM-DD
    hours: number;
    tasks: {
        id: string;
        title: string;
        projectTitle: string;
        projectColor: string;
        hours: number;
        status: string;
    }[];
}

export interface ResourceData {
    profile: Profile;
    allocations: { [date: string]: ResourceAllocation }; // Keyed by YYYY-MM-DD
    capacityPerDay: number;
}

/**
 * Fetches all internal resources (employees) and their task allocations for a given date range.
 */
export async function getResourceAvailability(
    startDate: Date,
    endDate: Date
): Promise<ResourceData[]> {
    console.log('Fetching resource availability for:', startDate, endDate);
    
    // Convert dates to string format expected by backend
    const startObj = startDate.toISOString();
    const endObj = endDate.toISOString();
    
    return await fetchApi(`/api/resources/availability?start=${encodeURIComponent(startObj)}&end=${encodeURIComponent(endObj)}`);
}

