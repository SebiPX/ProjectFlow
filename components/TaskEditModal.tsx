import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { updateTask } from '../services/api/tasks';
import { getProjects } from '../services/api/projects';
import { getProfiles } from '../services/api/profiles';
import { getServiceModules } from '../services/api/serviceModules';
import { getSeniorityLevels } from '../services/api/seniorityLevels';
import { getServicePricingRate } from '../services/api/taskVariance';
import type { Task } from '../types/supabase';
import { Icon } from './ui/Icon';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onTimeTrack?: (task: Task) => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ isOpen, onClose, task, onTimeTrack }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    project_id: task.project_id,
    status: task.status || 'todo',
    assigned_to: task.assignee_id || task.assigned_to || '',
    start_date: task.start_date ? new Date(task.start_date).toISOString().split('T')[0] : '',
    due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
    planned_minutes: task.planned_minutes?.toString() || '',
    is_visible_to_client: task.is_visible_to_client ?? true,
  });

  // Update form data when task changes
  useEffect(() => {
    setFormData({
      title: task.title,
      description: task.description || '',
      project_id: task.project_id,
      status: task.status || 'todo',
      assigned_to: task.assignee_id || task.assigned_to || '',
      start_date: task.start_date ? new Date(task.start_date).toISOString().split('T')[0] : '',
      due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
      planned_minutes: task.planned_minutes?.toString() || '',
      is_visible_to_client: task.is_visible_to_client ?? true,
    });
  }, [task]);

  // Fetch projects for dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    enabled: isOpen,
  });

  // Fetch profiles for assignee dropdown
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: getProfiles,
    enabled: isOpen,
  });

  // Service tracking state
  const [serviceModuleId, setServiceModuleId] = useState(task.service_module_id || '');
  const [seniorityLevelId, setSeniorityLevelId] = useState(task.seniority_level_id || '');
  const [estimatedHours, setEstimatedHours] = useState(task.estimated_hours?.toString() || '');
  const [estimatedRate, setEstimatedRate] = useState(task.estimated_rate?.toString() || '');

  // Fetch service modules for dropdown
  const { data: serviceModules = [] } = useQuery({
    queryKey: ['service-modules'],
    queryFn: getServiceModules,
    enabled: isOpen,
  });

  // Fetch seniority levels for dropdown
  const { data: seniorityLevels = [] } = useQuery({
    queryKey: ['seniority-levels'],
    queryFn: getSeniorityLevels,
    enabled: isOpen,
  });

  // Fetch pricing rate for auto-fill
  const { data: pricingRate } = useQuery({
    queryKey: ['service-pricing-rate', serviceModuleId, seniorityLevelId],
    queryFn: () => getServicePricingRate(serviceModuleId, seniorityLevelId),
    enabled: !!serviceModuleId && !!seniorityLevelId,
  });

  // Update service state when task changes
  useEffect(() => {
    setServiceModuleId(task.service_module_id || '');
    setSeniorityLevelId(task.seniority_level_id || '');
    setEstimatedHours(task.estimated_hours?.toString() || '');
    setEstimatedRate(task.estimated_rate?.toString() || '');
  }, [task]);

  // Auto-fill rate when pricing is loaded (only if rate is empty)
  useEffect(() => {
    if (pricingRate && !estimatedRate) {
      setEstimatedRate(pricingRate.toString());
    }
  }, [pricingRate]);

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Task>) => updateTask(task.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', task.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project-service-breakdown', task.project_id] });
      toast.success('Task updated successfully!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    updateMutation.mutate({
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      project_id: formData.project_id,
      status: formData.status as any,
      assigned_to: formData.assigned_to || null,
      start_date: formData.start_date || undefined,
      due_date: formData.due_date || null,
      planned_minutes: formData.planned_minutes ? parseInt(formData.planned_minutes) : undefined,
      is_visible_to_client: formData.is_visible_to_client,
      // Service tracking fields (optional)
      service_module_id: serviceModuleId || null,
      seniority_level_id: seniorityLevelId || null,
      estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
      estimated_rate: estimatedRate ? parseFloat(estimatedRate) : null,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Edit Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Task Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task name"
            />
          </div>

          {/* Project Selection */}
          <div>
            <label htmlFor="project_id" className="block text-sm font-medium text-gray-300 mb-2">
              Project *
            </label>
            <select
              id="project_id"
              required
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
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
              placeholder="Task description..."
            />
          </div>

          {/* Status & Assignee Row */}
          <div className="grid grid-cols-2 gap-4">
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
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-300 mb-2">
                Assign To
              </label>
              <select
                id="assigned_to"
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.full_name || profile.email}
                  </option>
                ))}
              </select>
            </div>
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
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-300 mb-2">
                Due Date
              </label>
              <input
                type="date"
                id="due_date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Planned Minutes */}
          <div>
            <label htmlFor="planned_minutes" className="block text-sm font-medium text-gray-300 mb-2">
              Planned Time (minutes)
            </label>
            <input
              type="number"
              id="planned_minutes"
              min="0"
              step="15"
              value={formData.planned_minutes}
              onChange={(e) => setFormData({ ...formData, planned_minutes: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
            <p className="text-xs text-gray-400 mt-1">
              Estimated time in minutes (e.g., 60 for 1 hour, 120 for 2 hours)
            </p>
          </div>

          {/* Service-Based Estimation (Optional) */}
          <div className="border-t border-gray-700 pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="w-5 h-5 text-blue-500" />
              Service-Based Estimation (Optional)
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              Link this task to a service from the catalog to enable Plan vs Actual tracking.
            </p>

            {/* Service Module & Seniority Level */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="service_module_id" className="block text-sm font-medium text-gray-300 mb-2">
                  Service Module
                </label>
                <select
                  id="service_module_id"
                  value={serviceModuleId}
                  onChange={(e) => {
                    setServiceModuleId(e.target.value);
                    setSeniorityLevelId(''); // Reset level when module changes
                    setEstimatedRate(''); // Reset rate
                  }}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={updateMutation.isPending}
                >
                  <option value="">None</option>
                  {serviceModules
                    .filter((m) => m.is_active)
                    .map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.service_module} ({module.category})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label htmlFor="seniority_level_id" className="block text-sm font-medium text-gray-300 mb-2">
                  Seniority Level
                </label>
                <select
                  id="seniority_level_id"
                  value={seniorityLevelId}
                  onChange={(e) => {
                    setSeniorityLevelId(e.target.value);
                    setEstimatedRate(''); // Reset rate to trigger auto-fill
                  }}
                  disabled={!serviceModuleId || updateMutation.isPending}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select level</option>
                  {seniorityLevels
                    .filter((l) => l.is_active)
                    .map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.level_name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Estimated Hours & Rate */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="estimated_hours" className="block text-sm font-medium text-gray-300 mb-2">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  id="estimated_hours"
                  min="0"
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  disabled={!serviceModuleId || updateMutation.isPending}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="0"
                />
                <p className="text-xs text-gray-400 mt-1">Planned billable hours</p>
              </div>

              <div>
                <label htmlFor="estimated_rate" className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
                  Estimated Rate (€/h)
                  {pricingRate && (
                    <span className="text-green-500 text-xs">(Auto-filled)</span>
                  )}
                </label>
                <input
                  type="number"
                  id="estimated_rate"
                  min="0"
                  step="0.01"
                  value={estimatedRate}
                  onChange={(e) => setEstimatedRate(e.target.value)}
                  disabled={!serviceModuleId || updateMutation.isPending}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-400 mt-1">Override if custom pricing</p>
              </div>
            </div>

            {/* Planned Value Preview */}
            {estimatedHours && estimatedRate && (
              <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                <p className="text-sm text-blue-300">
                  <strong>Planned Value:</strong>{' '}
                  {(parseFloat(estimatedHours) * parseFloat(estimatedRate)).toFixed(2)} €
                </p>
              </div>
            )}
          </div>

          {/* Client Visibility Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_visible_to_client"
              checked={formData.is_visible_to_client}
              onChange={(e) => setFormData({ ...formData, is_visible_to_client: e.target.checked })}
              className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="is_visible_to_client" className="ml-2 text-sm text-gray-300">
              Visible to client
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-700">
            {onTimeTrack && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onTimeTrack(task);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5" />
                Track Time
              </button>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                disabled={updateMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
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
                  'Update Task'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
