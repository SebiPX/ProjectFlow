import { fetchApi } from './client';
import type { ServiceModule, ServiceCategory } from '../../types/supabase';

export interface ServicePerformanceStats {
    service_module_id: string;
    service_name: string;
    category: ServiceCategory;
    revenue: number;
    cost: number;
    profit: number;
    margin_percent: number;
    tasks_count: number;
    hours_tracked: number;
}

/**
 * Calculate profitability per Service Module
 * Revenue = Sum of financial_items (in approved/paid invoices) linked to service
 * Cost = Sum of time_entries (duration * internal_cost) for tasks linked to service
 */
export async function getServiceProfitabilityStats(): Promise<ServicePerformanceStats[]> {
    return await fetchApi('/api/reports/service-profitability');
}

