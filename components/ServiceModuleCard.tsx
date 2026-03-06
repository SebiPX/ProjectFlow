import React, { useState } from 'react';
import type { ServiceModule } from '../types/supabase';
import { Icon } from './ui/Icon';

interface ServiceModuleCardProps {
  module: ServiceModule;
  onEdit: (module: ServiceModule) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

export const ServiceModuleCard: React.FC<ServiceModuleCardProps> = ({
  module,
  onEdit,
  onToggleActive,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Category badge colors
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'CONSULTING':
        return 'bg-blue-600';
      case 'CREATION':
        return 'bg-purple-600';
      case 'PRODUCTION':
        return 'bg-orange-600';
      case 'MANAGEMENT':
        return 'bg-green-600';
      case 'LOGISTICS':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-600';
    }
  };

  // Unit display text
  const getUnitText = (unit: string) => {
    switch (unit) {
      case 'hour':
        return 'Stunde';
      case 'day':
        return 'Tag';
      case 'flat':
        return 'Pauschal';
      case 'piece':
        return 'Stück';
      default:
        return unit;
    }
  };

  const pricingCount = module.pricing?.length || 0;
  const hasPricing = pricingCount > 0;

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
      {/* Header - Clickable to expand/collapse */}
      <div
        className="p-5 cursor-pointer hover:bg-gray-750 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 text-xs font-semibold rounded ${getCategoryColor(module.category)}`}>
                {module.category}
              </span>
              {!module.is_active && (
                <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-600 text-gray-300">
                  Inaktiv
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white">{module.service_module}</h3>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-white transition-colors ml-3"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <Icon
              path={
                isExpanded
                  ? 'M5 15l7-7 7 7'
                  : 'M19 9l-7 7-7-7'
              }
              className="w-6 h-6"
            />
          </button>
        </div>

        {module.description && (
          <p className="text-gray-400 text-sm mb-3">{module.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4" />
            {getUnitText(module.default_unit)}
          </span>
          <span className="flex items-center gap-1">
            <Icon path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4" />
            {hasPricing ? `${pricingCount} Preis${pricingCount !== 1 ? 'e' : ''} verfügbar` : 'Keine Preise'}
          </span>
        </div>
      </div>

      {/* Expanded Content - Pricing Table */}
      {isExpanded && hasPricing && (
        <div className="px-5 pb-5 border-t border-gray-700">
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">
              Preisübersicht
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-3 text-gray-400 font-medium">Level</th>
                    <th className="text-right py-2 px-3 text-gray-400 font-medium">Rate</th>
                    <th className="text-right py-2 px-3 text-gray-400 font-medium">Cost</th>
                    <th className="text-right py-2 px-3 text-gray-400 font-medium">Marge</th>
                  </tr>
                </thead>
                <tbody>
                  {module.pricing
                    ?.sort((a, b) => (a.seniority_level?.level_order || 0) - (b.seniority_level?.level_order || 0))
                    .map((pricing) => (
                      <tr key={pricing.id} className="border-b border-gray-700 last:border-0">
                        <td className="py-3 px-3 text-white font-medium">
                          {pricing.seniority_level?.level_name || 'N/A'}
                        </td>
                        <td className="py-3 px-3 text-right text-white">
                          {pricing.rate.toFixed(2)} €/{getUnitText(module.default_unit)?.toLowerCase() || ''}
                        </td>
                        <td className="py-3 px-3 text-right text-gray-400">
                          {(pricing.internal_cost || 0).toFixed(2)} €
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`font-semibold ${
                              (pricing.margin_percentage || 0) >= 35
                                ? 'text-green-500'
                                : (pricing.margin_percentage || 0) >= 25
                                ? 'text-yellow-500'
                                : 'text-red-500'
                            }`}
                          >
                            {(pricing.margin_percentage || 0).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-3 bg-gray-750 border-t border-gray-700 flex gap-3">
        <button
          type="button"
          onClick={() => onEdit(module)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-4 h-4 mr-2" />
          Bearbeiten
        </button>
        <button
          type="button"
          onClick={() => onToggleActive(module.id, !module.is_active)}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
            module.is_active
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          <Icon
            path={
              module.is_active
                ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
                : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
            }
            className="w-4 h-4 mr-2"
          />
          {module.is_active ? 'Deaktivieren' : 'Aktivieren'}
        </button>
      </div>
    </div>
  );
};
