import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { calculateProjectMargin } from '../services/api/projectFinancials';
import { Icon } from './ui/Icon';

interface ProjectMarginCardProps {
  projectId: string;
}

export const ProjectMarginCard: React.FC<ProjectMarginCardProps> = ({ projectId }) => {
  const {
    data: marginData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['project-margin', projectId],
    queryFn: () => calculateProjectMargin(projectId),
    staleTime: 60000, // 1 minute - margin should be relatively fresh
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !marginData) {
    return (
      <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4">
        <p className="text-red-500">Fehler beim Laden der Margin-Daten</p>
      </div>
    );
  }

  const { revenue, costs, profit, marginPercentage, status } = marginData;

  // Status colors and icons
  const getStatusConfig = () => {
    switch (status) {
      case 'excellent':
        return {
          color: 'text-green-500',
          bgColor: 'bg-green-900 bg-opacity-20',
          borderColor: 'border-green-700',
          icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
          label: 'Exzellent',
        };
      case 'good':
        return {
          color: 'text-primary',
          bgColor: 'bg-blue-900 bg-opacity-20',
          borderColor: 'border-blue-700',
          icon: 'M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5',
          label: 'Gut',
        };
      case 'acceptable':
        return {
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-900 bg-opacity-20',
          borderColor: 'border-yellow-700',
          icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
          label: 'Akzeptabel',
        };
      case 'poor':
        return {
          color: 'text-orange-500',
          bgColor: 'bg-orange-900 bg-opacity-20',
          borderColor: 'border-orange-700',
          icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
          label: 'Schwach',
        };
      case 'negative':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-900 bg-opacity-20',
          borderColor: 'border-red-700',
          icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
          label: 'Verlust',
        };
      default:
        return {
          color: 'text-muted-foreground',
          bgColor: 'bg-card',
          borderColor: 'border-border',
          icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
          label: 'Unbekannt',
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-foreground">Projekt-Marge</h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
          <Icon path={statusConfig.icon} className={`w-5 h-5 ${statusConfig.color}`} />
          <span className={`text-sm font-semibold ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="bg-gray-750 rounded-lg p-4 border border-input">
          <div className="flex items-center gap-2 mb-2">
            <Icon
              path="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              className="w-5 h-5 text-primary"
            />
            <span className="text-sm text-muted-foreground uppercase tracking-wider">Einnahmen</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {revenue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </p>
          <p className="text-xs text-muted-foreground mt-1">Genehmigte KVAs</p>
        </div>

        {/* Costs */}
        <div className="bg-gray-750 rounded-lg p-4 border border-input">
          <div className="flex items-center gap-2 mb-2">
            <Icon
              path="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              className="w-5 h-5 text-orange-500"
            />
            <span className="text-sm text-muted-foreground uppercase tracking-wider">Kosten</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {costs.totalCosts.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </p>
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            <div>Direkt: {costs.directCosts.toFixed(2)} €</div>
            <div>Stunden: {costs.billableHoursValue.toFixed(2)} €</div>
          </div>
        </div>

        {/* Profit */}
        <div className="bg-gray-750 rounded-lg p-4 border border-input">
          <div className="flex items-center gap-2 mb-2">
            <Icon
              path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              className={`w-5 h-5 ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}
            />
            <span className="text-sm text-muted-foreground uppercase tracking-wider">Gewinn</span>
          </div>
          <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {profit >= 0 ? '+' : ''}
            {profit.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </p>
          <p className="text-xs text-muted-foreground mt-1">Einnahmen - Kosten</p>
        </div>

        {/* Margin Percentage */}
        <div className={`rounded-lg p-4 border ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
          <div className="flex items-center gap-2 mb-2">
            <Icon
              path="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              className={`w-5 h-5 ${statusConfig.color}`}
            />
            <span className="text-sm text-muted-foreground uppercase tracking-wider">Marge</span>
          </div>
          <p className={`text-2xl font-bold ${statusConfig.color}`}>
            {marginPercentage.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {marginPercentage >= 30 && '≥ 30% Ziel'}
            {marginPercentage >= 20 && marginPercentage < 30 && '≥ 20% OK'}
            {marginPercentage >= 10 && marginPercentage < 20 && '≥ 10% Knapp'}
            {marginPercentage >= 0 && marginPercentage < 10 && '< 10% Kritisch'}
            {marginPercentage < 0 && 'Verlust'}
          </p>
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-4 p-3 bg-gray-750 rounded-lg border border-input">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Berechnung:</strong> Marge = (Einnahmen - Kosten) / Einnahmen × 100.
          Einnahmen basieren auf genehmigten Kostenvoranschlägen.
          Kosten umfassen direkte Projektkosten und den Wert erfasster billable Stunden.
        </p>
      </div>
    </div>
  );
};
