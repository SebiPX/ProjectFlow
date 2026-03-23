import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getServiceModulesWithPricing,
  updateServiceModule,
} from '../services/api/serviceModules';
import { getSeniorityLevels } from '../services/api/seniorityLevels';
import { ServiceModuleCard } from './ServiceModuleCard';
import { ServiceModuleFormModal } from './ServiceModuleFormModal';
import { Icon } from './ui/Icon';
import { toast } from 'react-toastify';
import { queryClient } from '../lib/queryClient';
import type { ServiceModule, ServiceCategory } from '../types/supabase';

interface ServiceModuleListProps {
  searchQuery?: string;
}

export const ServiceModuleList: React.FC<ServiceModuleListProps> = ({ searchQuery = '' }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ServiceModule | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'all'>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'category'>('category');

  // Fetch service modules
  const {
    data: modules = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['service-modules'],
    queryFn: getServiceModulesWithPricing,
  });

  // Fetch seniority levels
  const { data: seniorityLevels = [] } = useQuery({
    queryKey: ['seniority-levels'],
    queryFn: getSeniorityLevels,
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateServiceModule(id, { is_active: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-modules'] });
      toast.success('Status erfolgreich aktualisiert!');
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Filter and sort modules
  const filteredModules = modules
    .filter((module) => {
      if (categoryFilter !== 'all' && module.category !== categoryFilter) return false;
      if (!showInactive && !module.is_active) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          module.service_module.toLowerCase().includes(query) ||
          (module.description && module.description.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.service_module.localeCompare(b.service_module);
      } else {
        // Sort by category first, then by name
        if (a.category === b.category) {
          return a.service_module.localeCompare(b.service_module);
        }
        return a.category.localeCompare(b.category);
      }
    });

  const handleEdit = (module: ServiceModule) => {
    setEditingModule(module);
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    toggleActiveMutation.mutate({ id, isActive });
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingModule(null);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Lade Service-Katalog...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4">
          <p className="text-red-500">Fehler beim Laden des Service-Katalogs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Service-Katalog</h1>
          <p className="text-muted-foreground mt-1">
            Verwalten Sie Ihre Service-Module und Preise
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Icon path="M12 4v16m8-8H4" className="w-5 h-5 mr-2" />
          Neues Service-Modul
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg p-4 mb-6 flex flex-wrap gap-4">
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Kategorie:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ServiceCategory | 'all')}
            className="px-3 py-2 bg-muted border border-input rounded-lg text-foreground text-sm focus:outline-none focus:border-primary"
          >
            <option value="all">Alle</option>
            <option value="CONSULTING">Consulting</option>
            <option value="CREATION">Creation</option>
            <option value="PRODUCTION">Production</option>
            <option value="MANAGEMENT">Management</option>
            <option value="LOGISTICS">Logistics</option>
          </select>
        </div>

        {/* Show Inactive Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showInactive"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 text-primary bg-muted border-input rounded focus:ring-primary"
          />
          <label htmlFor="showInactive" className="text-sm text-muted-foreground">
            Inaktive anzeigen
          </label>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm font-medium text-muted-foreground">Sortieren:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'category')}
            className="px-3 py-2 bg-muted border border-input rounded-lg text-foreground text-sm focus:outline-none focus:border-primary"
          >
            <option value="category">Kategorie</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {/* Module Cards */}
      {filteredModules.length === 0 ? (
        <div className="bg-card rounded-lg p-12 text-center">
          <div className="flex justify-center mb-4">
            <Icon
              path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              className="w-16 h-16 text-gray-600"
            />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {categoryFilter !== 'all' || !showInactive
              ? 'Keine Services gefunden'
              : 'Noch keine Services'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {categoryFilter !== 'all' || !showInactive
              ? 'Passen Sie die Filter an, um mehr Services zu sehen.'
              : 'Erstellen Sie Ihr erstes Service-Modul, um loszulegen.'}
          </p>
          {categoryFilter === 'all' && showInactive && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Service-Modul erstellen
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredModules.map((module) => (
            <ServiceModuleCard
              key={module.id}
              module={module}
              onEdit={handleEdit}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <ServiceModuleFormModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseModal}
          seniorityLevels={seniorityLevels}
        />
      )}

      {editingModule && (
        <ServiceModuleFormModal
          isOpen={!!editingModule}
          onClose={handleCloseModal}
          module={editingModule}
          seniorityLevels={seniorityLevels}
        />
      )}
    </div>
  );
};
