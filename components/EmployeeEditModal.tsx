import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { updateProfile } from '../services/api/profiles';
import { Profile, UserRole } from '../types/supabase';
import { Icon } from './ui/Icon';

interface EmployeeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Profile;
}

export const EmployeeEditModal: React.FC<EmployeeEditModalProps> = ({ isOpen, onClose, employee }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: employee.full_name || '',
    email: employee.email || '',
    role: employee.role || UserRole.Creative,
    weekly_hours: employee.weekly_hours?.toString() || '40',
    billable_hourly_rate: employee.billable_hourly_rate?.toString() || '0',
    internal_cost_per_hour: employee.internal_cost_per_hour?.toString() || '0',
  });

  useEffect(() => {
    setFormData({
      full_name: employee.full_name || '',
      email: employee.email || '',
      role: employee.role || UserRole.Creative,
      weekly_hours: employee.weekly_hours?.toString() || '40',
      billable_hourly_rate: employee.billable_hourly_rate?.toString() || '0',
      internal_cost_per_hour: employee.internal_cost_per_hour?.toString() || '0',
    });
  }, [employee]);

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Profile>) => updateProfile(employee.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Employee updated successfully!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Failed to update employee: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const weeklyHours = parseFloat(formData.weekly_hours);
    const billableRate = parseFloat(formData.billable_hourly_rate);
    const internalCost = parseFloat(formData.internal_cost_per_hour);

    if (isNaN(weeklyHours) || weeklyHours <= 0) {
      toast.error('Please enter valid weekly hours');
      return;
    }

    if (isNaN(billableRate) || billableRate < 0) {
      toast.error('Please enter a valid billable rate');
      return;
    }

    if (isNaN(internalCost) || internalCost < 0) {
      toast.error('Please enter a valid internal cost');
      return;
    }

    updateMutation.mutate({
      full_name: formData.full_name.trim() || null,
      email: formData.email.trim() || null,
      role: formData.role as UserRole,
      weekly_hours: weeklyHours,
      billable_hourly_rate: billableRate,
      internal_cost_per_hour: internalCost,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">Edit Employee</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={updateMutation.isPending}
          >
            <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
              disabled={updateMutation.isPending}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="john@example.com"
              disabled={updateMutation.isPending}
            />
            <p className="text-xs text-gray-500 mt-1">
              Note: Changing email may require verification
            </p>
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
              Role
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={updateMutation.isPending}
            >
              <option value="admin">Admin</option>
              <option value="pjm">PJM</option>
              <option value="creative">Creative</option>
              <option value="client">Client</option>
              <option value="guest">Guest</option>
            </select>
          </div>

          {/* Weekly Hours */}
          <div>
            <label htmlFor="weekly_hours" className="block text-sm font-medium text-gray-300 mb-2">
              Weekly Hours <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="weekly_hours"
              required
              min="1"
              max="168"
              step="0.5"
              value={formData.weekly_hours}
              onChange={(e) => setFormData({ ...formData, weekly_hours: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="40"
              disabled={updateMutation.isPending}
            />
            <p className="text-xs text-gray-500 mt-1">
              Contracted weekly working hours
            </p>
          </div>

          {/* Billable Hourly Rate */}
          <div>
            <label htmlFor="billable_rate" className="block text-sm font-medium text-gray-300 mb-2">
              Billable Hourly Rate (€) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="billable_rate"
              required
              min="0"
              step="0.01"
              value={formData.billable_hourly_rate}
              onChange={(e) => setFormData({ ...formData, billable_hourly_rate: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="75.00"
              disabled={updateMutation.isPending}
            />
            <p className="text-xs text-gray-500 mt-1">
              Rate charged to clients for this employee's time
            </p>
          </div>

          {/* Internal Cost Per Hour */}
          <div>
            <label htmlFor="internal_cost" className="block text-sm font-medium text-gray-300 mb-2">
              Internal Cost Per Hour (€) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="internal_cost"
              required
              min="0"
              step="0.01"
              value={formData.internal_cost_per_hour}
              onChange={(e) => setFormData({ ...formData, internal_cost_per_hour: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="50.00"
              disabled={updateMutation.isPending}
            />
            <p className="text-xs text-gray-500 mt-1">
              Internal cost (salary + overhead) per hour
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              disabled={updateMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Icon
                    path="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    className="w-4 h-4 animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Icon path="M5 13l4 4L19 7" className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
