import { fetchApi } from './client';

/**
 * Calculate project revenue from approved quotes
 */
export async function calculateProjectRevenue(projectId: string): Promise<number> {
  const result = await fetchApi(`/api/projects/${projectId}/revenue`);
  return result.revenue || 0;
}

/**
 * Calculate project costs (direct costs + billable hours value)
 */
export async function calculateProjectCosts(projectId: string): Promise<{
  directCosts: number;
  billableHoursValue: number;
  totalCosts: number;
}> {
  return await fetchApi(`/api/projects/${projectId}/costs/calculate`);
}

/**
 * Calculate project margin
 */
export async function calculateProjectMargin(projectId: string): Promise<{
  revenue: number;
  costs: {
    directCosts: number;
    billableHoursValue: number;
    totalCosts: number;
  };
  profit: number;
  marginPercentage: number;
  status: 'excellent' | 'good' | 'acceptable' | 'poor' | 'negative';
}> {
  return await fetchApi(`/api/projects/${projectId}/margin`);
}

/**
 * Calculate margins for multiple projects (for ProjectList display)
 */
export async function calculateProjectsMargins(
  projectIds: string[]
): Promise<Record<string, { profit: number; marginPercentage: number; status: string }>> {
  return await fetchApi(`/api/projects/margins-batch`, {
    method: 'POST',
    body: JSON.stringify({ projectIds })
  });
}

/**
 * Sync project budget with total approved revenue
 */
export async function syncProjectBudget(projectId: string): Promise<void> {
  await fetchApi(`/api/projects/${projectId}/budget/sync`, {
    method: 'POST'
  }).catch(err => {
    console.error('Error syncing project budget:', err);
  });
}

