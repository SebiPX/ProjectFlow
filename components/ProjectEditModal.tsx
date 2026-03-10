import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { updateProject, archiveProject } from '../services/api/projects';
import { getClients } from '../services/api/clients';
import type { Project } from '../types/supabase';
import { Icon } from './ui/Icon';

interface ProjectEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const ProjectEditModal: React.FC<ProjectEditModalProps> = ({ isOpen, onClose, project }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: project.title,
    description: project.description || '',
    client_id: project.client_id,
    category: project.category || 'other',
    status: project.status || 'planned',
    budget_total: project.budget_total?.toString() || '',
    start_date: project.start_date || '',
    deadline: project.deadline || '',
    color_code: project.color_code || '#3b82f6',
  });

  // Update form data when project changes
  useEffect(() => {
    setFormData({
      title: project.title,
      description: project.description || '',
      client_id: project.client_id,
      category: project.category || 'other',
      status: project.status || 'planned',
      budget_total: project.budget_total?.toString() || '',
      start_date: project.start_date || '',
      deadline: project.deadline || '',
      color_code: project.color_code || '#3b82f6',
    });
  }, [project]);

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
    enabled: isOpen,
  });

  // Update project mutation
  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Project>) => updateProject(project.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated successfully!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Failed to update project: ${error.message}`);
    },
  });

  // Archive project mutation
  const archiveMutation = useMutation({
    mutationFn: (isArchived: boolean) => archiveProject(project.id, isArchived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(project.is_archived ? 'Project unarchived successfully!' : 'Project archived successfully!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Failed to archive project: ${error.message}`);
    },
  });

  const handleArchiveToggle = () => {
    if (project.is_archived) {
      archiveMutation.mutate(false);
    } else {
      if (window.confirm("Are you sure you want to archive this project? It will be hidden from the active list.")) {
        archiveMutation.mutate(true);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Project title is required');
      return;
    }

    if (!formData.client_id) {
      toast.error('Please select a client');
      return;
    }

    updateMutation.mutate({
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      client_id: formData.client_id,
      category: formData.category as any,
      status: formData.status as any,
      budget_total: formData.budget_total ? parseFloat(formData.budget_total) : 0,
      start_date: formData.start_date || null,
      deadline: formData.deadline || null,
      color_code: formData.color_code,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Edit Project</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              Project Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project name"
            />
          </div>

          {/* Client Selection */}
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-300 mb-2">
              Client *
            </label>
            <select
              id="client_id"
              required
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Project description..."
            />
          </div>

          {/* Category & Status Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="web_design">Web Design</option>
                <option value="app_dev">App Development</option>
                <option value="social_campaign">Social Campaign</option>
                <option value="tv_commercial">TV Commercial</option>
                <option value="on_air_promotion">On-Air Promotion</option>
                <option value="event">Event</option>
                <option value="user_experience">User Experience</option>
                <option value="consulting">Consulting</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Budget */}
          <div>
            <label htmlFor="budget_total" className="block text-sm font-medium text-gray-300 mb-2">
              Total Budget (€)
            </label>
            <input
              type="number"
              id="budget_total"
              min="0"
              step="0.01"
              value={formData.budget_total}
              onChange={(e) => setFormData({ ...formData, budget_total: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="start_date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-300 mb-2">
                Deadline
              </label>
              <input
                type="date"
                id="deadline"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label htmlFor="color_code" className="block text-sm font-medium text-gray-300 mb-2">
              Project Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="color_code"
                value={formData.color_code}
                onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <span className="text-gray-400 text-sm">{formData.color_code}</span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-700">
            <div>
              <button
                type="button"
                onClick={handleArchiveToggle}
                className={`px-4 py-2 ${project.is_archived ? 'bg-green-600 hover:bg-green-700 text-white' : 'border border-red-500 text-red-500 hover:bg-red-500 hover:text-white'} rounded-lg transition-colors`}
                disabled={archiveMutation.isPending}
              >
                {archiveMutation.isPending ? 'Processing...' : project.is_archived ? 'Unarchive Project' : 'Archive Project'}
              </button>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                disabled={updateMutation.isPending || archiveMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending || archiveMutation.isPending}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updateMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update Project'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
