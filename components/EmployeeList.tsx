import React, { useState } from 'react';
import { usePresence } from '../lib/PresenceContext';
import { useAuth } from '../lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getInternalProfiles, getTeamDirectory } from '../services/api/profiles';
import { EmployeeEditModal } from './EmployeeEditModal';
import type { Profile } from '../types/supabase';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { Avatar } from './ui/Avatar';

interface EmployeeListProps {
  searchQuery?: string;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({ searchQuery = '' }) => {
  const [editingEmployee, setEditingEmployee] = useState<Profile | null>(null);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const { onlineUsers } = usePresence();
  const { profile } = useAuth();

  const isAdmin = profile?.role === 'admin';

  const { data: employees = [], isLoading, error } = useQuery({
    queryKey: ['employees', isAdmin ? 'admin' : 'public'],
    queryFn: isAdmin ? getInternalProfiles : getTeamDirectory,
  });

  const filteredEmployees = employees.filter(employee => {
    // 1. Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        (employee.full_name?.toLowerCase() || '').includes(query) ||
        (employee.email?.toLowerCase() || '').includes(query)
      );
      if (!matchesSearch) return false;
    }

    // 2. Online Only Filter
    if (showOnlineOnly) {
      if (!onlineUsers.has(employee.id)) return false;
    }

    return true;
  });


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Loading employees...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500 text-xl">
          {isAdmin ? 'Error loading employees.' : 'Please run scripts/secure_team_view.sql on Supabase.'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Team Members</h1>
          <p className="text-gray-400 mt-1">{filteredEmployees.length} {showOnlineOnly ? 'online' : ''} employees</p>
        </div>

        <button
          onClick={() => setShowOnlineOnly(!showOnlineOnly)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showOnlineOnly
              ? 'bg-green-500/20 border-green-500 text-green-400'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
        >
          <div className={`w-2.5 h-2.5 rounded-full ${showOnlineOnly ? 'bg-green-400' : 'bg-gray-500'}`} />
          <span className="text-sm font-medium">Online Only</span>
        </button>
      </div>

      {filteredEmployees.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-xl">No team members found</p>
          <p className="mt-2 text-sm">{searchQuery ? 'Try adjusting your search terms.' : ''}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEmployees.map((employee) => (
            <Card
              key={employee.id}
              className={`p-6 transition-all duration-200 ${isAdmin ? 'hover:border-blue-500 cursor-pointer' : ''}`}
              onClick={() => isAdmin && setEditingEmployee(employee)}
            >
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <Avatar
                  avatarPath={employee.avatar_url}
                  alt={employee.full_name || 'Employee'}
                  className="w-24 h-24 rounded-full mb-4 object-cover"
                  isOnline={onlineUsers.has(employee.id)}
                />

                {/* Name & Email */}
                <h3 className="text-lg font-bold text-white mb-1">
                  {employee.full_name || 'Unnamed'}
                </h3>
                <p className="text-sm text-gray-400 mb-3">{employee.email}</p>

                {/* Role Badge */}
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full mb-4 ${employee.role === 'admin'
                    ? 'bg-purple-500/20 text-purple-400'
                    : employee.role === 'pjm'
                      ? 'bg-green-500/20 text-green-400'
                      : employee.role === 'creative'
                        ? 'bg-blue-500/20 text-blue-400'
                        : employee.role === 'client'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-gray-500/20 text-gray-400'
                    }`}
                >
                  {employee.role?.toUpperCase() || 'GUEST'}
                </span>

                {/* Stats - ONLY VISIBLE TO ADMINS */}
                {isAdmin && (
                  <div className="w-full space-y-2 border-t border-gray-700 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Weekly Hours:</span>
                      <span className="text-white font-semibold">
                        {employee.weekly_hours || 40}h
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Billable Rate:</span>
                      <span className="text-white font-semibold">
                        €{employee.billable_hourly_rate || 0}/h
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Internal Cost:</span>
                      <span className="text-white font-semibold">
                        €{employee.internal_cost_per_hour || 0}/h
                      </span>
                    </div>
                  </div>
                )}

                {/* Edit Button - ONLY VISIBLE TO ADMINS */}
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingEmployee(employee);
                    }}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-4 h-4" />
                    Edit Details
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {editingEmployee && (
        <EmployeeEditModal
          isOpen={!!editingEmployee}
          onClose={() => setEditingEmployee(null)}
          employee={editingEmployee}
        />
      )}
    </div>
  );
};

