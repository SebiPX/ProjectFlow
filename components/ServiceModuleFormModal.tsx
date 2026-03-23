import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  createServiceModule,
  updateServiceModule,
  deleteServiceModule,
} from '../services/api/serviceModules';
import {
  createMultiplePricings,
  updateServicePricing,
  deleteServicePricing,
  deletePricingByServiceModule,
} from '../services/api/servicePricing';
import type { ServiceModule, SeniorityLevel, ServiceCategory, ServiceUnit } from '../types/supabase';
import { Icon } from './ui/Icon';
import { toast } from 'react-toastify';
import { queryClient } from '../lib/queryClient';

interface ServiceModuleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  module?: ServiceModule;
  seniorityLevels: SeniorityLevel[];
}

interface PricingRow {
  levelId: string;
  levelName: string;
  levelOrder: number;
  enabled: boolean;
  rate: string;
  internalCost: string;
  pricingId?: string; // Existing pricing entry ID for edits
}

export const ServiceModuleFormModal: React.FC<ServiceModuleFormModalProps> = ({
  isOpen,
  onClose,
  module,
  seniorityLevels,
}) => {
  const isEditMode = !!module;

  const [formData, setFormData] = useState({
    service_module: module?.service_module || '',
    category: (module?.category || 'CONSULTING') as ServiceCategory,
    description: module?.description || '',
    default_unit: (module?.default_unit || 'hour') as ServiceUnit,
    is_active: module?.is_active ?? true,
  });

  const [pricingRows, setPricingRows] = useState<PricingRow[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize pricing rows
  useEffect(() => {
    const rows: PricingRow[] = seniorityLevels.map((level) => {
      const existingPricing = module?.pricing?.find(
        (p) => p.seniority_level_id === level.id
      );

      return {
        levelId: level.id,
        levelName: level.level_name,
        levelOrder: level.level_order,
        enabled: !!existingPricing,
        rate: existingPricing?.rate?.toString() || '',
        internalCost: existingPricing?.internal_cost?.toString() || '0',
        pricingId: existingPricing?.id,
      };
    });

    setPricingRows(rows.sort((a, b) => a.levelOrder - b.levelOrder));
  }, [module, seniorityLevels]);

  const createMutation = useMutation({
    mutationFn: async () => {
      // 1. Create service module
      const newModule = await createServiceModule(formData);

      // 2. Create pricing entries for enabled levels
      const pricingsToCreate = pricingRows
        .filter((row) => row.enabled && parseFloat(row.rate) > 0)
        .map((row) => ({
          service_module_id: newModule.id,
          seniority_level_id: row.levelId,
          rate: parseFloat(row.rate),
          internal_cost: parseFloat(row.internalCost) || 0,
          is_active: true,
        }));

      if (pricingsToCreate.length > 0) {
        await createMultiplePricings(pricingsToCreate);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-modules'] });
      toast.success('Service-Modul erfolgreich erstellt!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Fehler beim Erstellen: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!module) return;

      // 1. Update service module
      await updateServiceModule(module.id, formData);

      // 2. Handle pricing updates/creates/deletes
      for (const row of pricingRows) {
        if (row.enabled && parseFloat(row.rate) > 0) {
          // Create or update pricing
          if (row.pricingId) {
            // Update existing
            await updateServicePricing(row.pricingId, {
              rate: parseFloat(row.rate),
              internal_cost: parseFloat(row.internalCost) || 0,
            });
          } else {
            // Create new
            await createMultiplePricings([
              {
                service_module_id: module.id,
                seniority_level_id: row.levelId,
                rate: parseFloat(row.rate),
                internal_cost: parseFloat(row.internalCost) || 0,
                is_active: true,
              },
            ]);
          }
        } else if (!row.enabled && row.pricingId) {
          // Delete pricing if disabled
          await deleteServicePricing(row.pricingId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-modules'] });
      toast.success('Service-Modul erfolgreich aktualisiert!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Fehler beim Aktualisieren: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteServiceModule(module!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-modules'] });
      toast.success('Service-Modul erfolgreich gelöscht!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Fehler beim Löschen: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.service_module.trim()) {
      toast.error('Bitte Service-Modul-Name eingeben');
      return;
    }

    if (formData.service_module.length > 200) {
      toast.error('Name darf maximal 200 Zeichen lang sein');
      return;
    }

    const enabledRows = pricingRows.filter((row) => row.enabled);
    if (enabledRows.length === 0) {
      toast.error('Mindestens ein Seniority-Level muss aktiviert sein');
      return;
    }

    for (const row of enabledRows) {
      const rate = parseFloat(row.rate);
      const cost = parseFloat(row.internalCost);

      if (isNaN(rate) || rate <= 0) {
        toast.error(`Bitte gültigen Rate für ${row.levelName} eingeben (größer als 0)`);
        return;
      }

      if (isNaN(cost) || cost < 0) {
        toast.error(`Bitte gültigen Internal Cost für ${row.levelName} eingeben (mindestens 0)`);
        return;
      }
    }

    if (isEditMode) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleClose = () => {
    if (!createMutation.isPending && !updateMutation.isPending && !deleteMutation.isPending) {
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const updatePricingRow = (levelId: string, field: keyof PricingRow, value: any) => {
    setPricingRows((rows) =>
      rows.map((row) => (row.levelId === levelId ? { ...row, [field]: value } : row))
    );
  };

  const calculateMargin = (rate: string, cost: string): number => {
    const r = parseFloat(rate);
    const c = parseFloat(cost);
    if (isNaN(r) || r <= 0) return 0;
    return ((r - c) / r) * 100;
  };

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">
            {isEditMode ? 'Service-Modul bearbeiten' : 'Neues Service-Modul'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Service Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Service-Information
            </h3>

            {/* Service Module Name */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Service-Modul <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.service_module}
                onChange={(e) =>
                  setFormData({ ...formData, service_module: e.target.value })
                }
                className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-gray-400 focus:outline-none focus:border-primary"
                placeholder="z.B. STRATEGY, DESIGN, RECORDING"
                maxLength={200}
                disabled={isPending}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.service_module.length} / 200 Zeichen
              </p>
            </div>

            {/* Category & Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Kategorie <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as ServiceCategory })
                  }
                  className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:border-primary"
                  disabled={isPending}
                  required
                >
                  <option value="CONSULTING">Consulting</option>
                  <option value="CREATION">Creation</option>
                  <option value="PRODUCTION">Production</option>
                  <option value="MANAGEMENT">Management</option>
                  <option value="LOGISTICS">Logistics</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Einheit <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.default_unit}
                  onChange={(e) =>
                    setFormData({ ...formData, default_unit: e.target.value as ServiceUnit })
                  }
                  className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:border-primary"
                  disabled={isPending}
                  required
                >
                  <option value="hour">Stunde</option>
                  <option value="day">Tag</option>
                  <option value="flat">Pauschal</option>
                  <option value="piece">Stück</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Beschreibung
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-gray-400 focus:outline-none focus:border-primary resize-none"
                placeholder="Detaillierte Beschreibung des Service..."
                rows={3}
                disabled={isPending}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="w-4 h-4 text-primary bg-muted border-input rounded focus:ring-primary"
                disabled={isPending}
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-muted-foreground">
                Service ist aktiv (verfügbar für Kostenvoranschläge)
              </label>
            </div>
          </div>

          {/* Pricing Matrix Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Preise für Seniority-Levels
            </h3>
            <p className="text-sm text-muted-foreground">
              Aktivieren Sie die gewünschten Seniority-Levels und legen Sie die Preise fest.
              Die Marge wird automatisch berechnet.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-3 text-muted-foreground font-medium w-12"></th>
                    <th className="text-left py-3 px-3 text-muted-foreground font-medium">Level</th>
                    <th className="text-left py-3 px-3 text-muted-foreground font-medium">Rate (€)</th>
                    <th className="text-left py-3 px-3 text-muted-foreground font-medium">
                      Internal Cost (€)
                    </th>
                    <th className="text-left py-3 px-3 text-muted-foreground font-medium">Marge (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingRows.map((row) => {
                    const margin = calculateMargin(row.rate, row.internalCost);
                    const isValid = row.enabled && parseFloat(row.rate) > 0;

                    return (
                      <tr key={row.levelId} className="border-b border-border last:border-0">
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={row.enabled}
                            onChange={(e) =>
                              updatePricingRow(row.levelId, 'enabled', e.target.checked)
                            }
                            className="w-4 h-4 text-primary bg-muted border-input rounded focus:ring-primary"
                            disabled={isPending}
                          />
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-foreground font-medium">{row.levelName}</span>
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            value={row.rate}
                            onChange={(e) =>
                              updatePricingRow(row.levelId, 'rate', e.target.value)
                            }
                            className="w-full px-3 py-2 bg-muted border border-input rounded text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            disabled={!row.enabled || isPending}
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            value={row.internalCost}
                            onChange={(e) =>
                              updatePricingRow(row.levelId, 'internalCost', e.target.value)
                            }
                            className="w-full px-3 py-2 bg-muted border border-input rounded text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            disabled={!row.enabled || isPending}
                          />
                        </td>
                        <td className="py-3 px-3">
                          {row.enabled && isValid ? (
                            <span
                              className={`font-semibold ${
                                margin >= 35
                                  ? 'text-green-500'
                                  : margin >= 25
                                  ? 'text-yellow-500'
                                  : 'text-red-500'
                              }`}
                            >
                              {margin.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delete Section (Edit Mode Only) */}
          {isEditMode && (
            <div className="pt-6 border-t border-border">
              <h3 className="text-lg font-semibold text-foreground mb-3">Gefahrenzone</h3>
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isPending}
                  className="flex items-center px-4 py-2 bg-red-600 text-foreground rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon
                    path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    className="w-5 h-5 mr-2"
                  />
                  Service-Modul löschen
                </button>
              ) : (
                <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4">
                  <p className="text-foreground mb-3">
                    Möchten Sie dieses Service-Modul wirklich unwiderruflich löschen? Alle
                    zugehörigen Preise werden ebenfalls gelöscht.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleteMutation.isPending}
                      className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      className="flex items-center px-4 py-2 bg-red-600 text-foreground rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteMutation.isPending ? (
                        <>
                          <Icon
                            path="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            className="w-4 h-4 mr-2 animate-spin"
                          />
                          Löschen...
                        </>
                      ) : (
                        'Ja, löschen'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Icon
                  path="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  className="w-4 h-4 mr-2 animate-spin"
                />
                Speichern...
              </>
            ) : (
              <>
                <Icon path="M5 13l4 4L19 7" className="w-5 h-5 mr-2" />
                {isEditMode ? 'Änderungen speichern' : 'Service-Modul erstellen'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
