import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProjectServiceBreakdown } from '../services/api/taskVariance';
import { Icon } from './ui/Icon';

interface ProjectServiceBreakdownProps {
  projectId: string;
}

/**
 * ProjectServiceBreakdown Component
 * Displays aggregated Plan vs Actual breakdown by service module for a project
 * Shows total estimated vs actual hours/costs grouped by service with variance indicators
 */
export const ProjectServiceBreakdown: React.FC<ProjectServiceBreakdownProps> = ({ projectId }) => {
  const {
    data: breakdown = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['project-service-breakdown', projectId],
    queryFn: () => getProjectServiceBreakdown(projectId),
    staleTime: 60000, // 1 minute
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4">
        <p className="text-red-500">Error loading service breakdown</p>
      </div>
    );
  }

  if (breakdown.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="text-center py-8">
          <Icon
            path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            className="w-12 h-12 text-gray-600 mx-auto mb-3"
          />
          <p className="text-muted-foreground">No service-tracked tasks yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Link tasks to services to see Plan vs Actual breakdown
          </p>
        </div>
      </div>
    );
  }

  // Get variance status color
  const getVarianceStatusColor = (status: string) => {
    switch (status) {
      case 'under':
        return 'text-green-500';
      case 'on_track':
        return 'text-primary';
      case 'over':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
        <Icon
          path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          className="w-6 h-6 text-primary"
        />
        Service Breakdown
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Service</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Tasks</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Planned Hours</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actual Hours</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Hours Δ</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Planned Value</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actual Value</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Value Δ</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((item, index) => (
              <tr
                key={`${item.service_module_id}_${item.seniority_level_id || 'none'}`}
                className={`border-b border-border hover:bg-gray-750 ${
                  index % 2 === 0 ? 'bg-card' : 'bg-gray-750/50'
                }`}
              >
                {/* Service Name + Level */}
                <td className="py-3 px-4">
                  <div>
                    <p className="text-foreground font-medium">{item.service_module_name}</p>
                    {item.seniority_level_name && (
                      <p className="text-xs text-muted-foreground">{item.seniority_level_name}</p>
                    )}
                  </div>
                </td>

                {/* Task Count */}
                <td className="text-right py-3 px-4 text-muted-foreground">{item.task_count}</td>

                {/* Planned Hours */}
                <td className="text-right py-3 px-4 text-muted-foreground">
                  {item.total_estimated_hours.toFixed(1)}h
                </td>

                {/* Actual Hours */}
                <td className="text-right py-3 px-4 text-muted-foreground">
                  {item.total_actual_hours.toFixed(1)}h
                </td>

                {/* Hours Variance */}
                <td
                  className={`text-right py-3 px-4 font-medium ${getVarianceStatusColor(
                    item.variance_status
                  )}`}
                >
                  {item.hours_variance >= 0 ? '+' : ''}
                  {item.hours_variance.toFixed(1)}h
                </td>

                {/* Planned Value */}
                <td className="text-right py-3 px-4 text-muted-foreground">
                  {item.total_planned_value.toFixed(2)} €
                </td>

                {/* Actual Value */}
                <td className="text-right py-3 px-4 text-muted-foreground">
                  {item.total_actual_value.toFixed(2)} €
                </td>

                {/* Value Variance */}
                <td
                  className={`text-right py-3 px-4 font-medium ${getVarianceStatusColor(
                    item.variance_status
                  )}`}
                >
                  {item.value_variance >= 0 ? '+' : ''}
                  {item.value_variance.toFixed(2)} €
                </td>
              </tr>
            ))}
          </tbody>

          {/* Total Row */}
          <tfoot>
            <tr className="border-t-2 border-input font-bold">
              <td className="py-3 px-4 text-foreground">TOTAL</td>
              <td className="text-right py-3 px-4 text-foreground">
                {breakdown.reduce((sum, item) => sum + item.task_count, 0)}
              </td>
              <td className="text-right py-3 px-4 text-foreground">
                {breakdown.reduce((sum, item) => sum + item.total_estimated_hours, 0).toFixed(1)}h
              </td>
              <td className="text-right py-3 px-4 text-foreground">
                {breakdown.reduce((sum, item) => sum + item.total_actual_hours, 0).toFixed(1)}h
              </td>
              <td className="text-right py-3 px-4 text-foreground">
                {breakdown.reduce((sum, item) => sum + item.hours_variance, 0).toFixed(1)}h
              </td>
              <td className="text-right py-3 px-4 text-foreground">
                {breakdown.reduce((sum, item) => sum + item.total_planned_value, 0).toFixed(2)} €
              </td>
              <td className="text-right py-3 px-4 text-foreground">
                {breakdown.reduce((sum, item) => sum + item.total_actual_value, 0).toFixed(2)} €
              </td>
              <td className="text-right py-3 px-4 text-foreground">
                {breakdown.reduce((sum, item) => sum + item.value_variance, 0).toFixed(2)} €
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
