import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { calculateTaskVariance } from '../services/api/taskVariance';
import { Icon } from './ui/Icon';

interface TaskPlanVsActualProps {
  taskId: string;
}

/**
 * TaskPlanVsActual Component
 * Displays Plan vs Actual comparison for a single task with service tracking
 * Shows estimated vs actual hours/costs with variance indicators
 */
export const TaskPlanVsActual: React.FC<TaskPlanVsActualProps> = ({ taskId }) => {
  const {
    data: variance,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['task-variance', taskId],
    queryFn: () => calculateTaskVariance(taskId),
    staleTime: 60000, // 1 minute - variance should be relatively fresh
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg p-4 border border-border">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-3">
        <p className="text-sm text-red-500">Error loading variance data</p>
      </div>
    );
  }

  // If no service tracking, don't show anything (progressive enhancement)
  if (!variance) {
    return null;
  }

  // Status configuration with colors and icons
  const getStatusConfig = () => {
    switch (variance.status) {
      case 'under_budget':
        return {
          color: 'text-green-500',
          bgColor: 'bg-green-900/20',
          borderColor: 'border-green-700',
          icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
          label: 'Under Budget',
        };
      case 'on_budget':
        return {
          color: 'text-primary',
          bgColor: 'bg-blue-900/20',
          borderColor: 'border-blue-700',
          icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
          label: 'On Budget',
        };
      case 'over_budget':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-900/20',
          borderColor: 'border-red-700',
          icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
          label: 'Over Budget',
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="bg-card rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-foreground">Plan vs Actual</h4>
        <div className={`flex items-center gap-1 px-2 py-1 rounded border ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
          <Icon path={statusConfig.icon} className={`w-4 h-4 ${statusConfig.color}`} />
          <span className={`text-xs font-medium ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Planned Column */}
        <div className="bg-gray-750 rounded p-3 border border-input">
          <div className="flex items-center gap-1 mb-1">
            <Icon
              path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              className="w-4 h-4 text-muted-foreground"
            />
            <span className="text-xs text-muted-foreground uppercase">Planned</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {variance.estimated_hours.toFixed(1)}h
          </p>
          <p className="text-xs text-muted-foreground">
            {variance.planned_value.toFixed(2)} € @ {variance.estimated_rate}€/h
          </p>
        </div>

        {/* Actual Column */}
        <div className="bg-gray-750 rounded p-3 border border-input">
          <div className="flex items-center gap-1 mb-1">
            <Icon
              path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              className="w-4 h-4 text-muted-foreground"
            />
            <span className="text-xs text-muted-foreground uppercase">Actual</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {variance.actual_hours.toFixed(1)}h
          </p>
          <p className="text-xs text-muted-foreground">
            {variance.actual_value.toFixed(2)} €
            {variance.actual_rates.length > 0 &&
              ` @ avg ${(variance.actual_value / variance.actual_hours).toFixed(0)}€/h`}
          </p>
        </div>

        {/* Variance Column */}
        <div className={`rounded p-3 border ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
          <div className="flex items-center gap-1 mb-1">
            <Icon
              path="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              className={`w-4 h-4 ${statusConfig.color}`}
            />
            <span className="text-xs text-muted-foreground uppercase">Variance</span>
          </div>
          <p className={`text-lg font-bold ${statusConfig.color}`}>
            {variance.hours_variance >= 0 ? '+' : ''}
            {variance.hours_variance.toFixed(1)}h
          </p>
          <p className={`text-xs ${statusConfig.color}`}>
            {variance.value_variance >= 0 ? '+' : ''}
            {variance.value_variance.toFixed(2)} € ({variance.value_variance_percent.toFixed(0)}%)
          </p>
        </div>
      </div>
    </div>
  );
};
