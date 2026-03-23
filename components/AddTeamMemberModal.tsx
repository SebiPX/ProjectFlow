import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Icon } from './ui/Icon';
import { getInternalUsers, addProjectMember, getProjectMembers } from '../services/api/projectMembers';
import { getMultipleUsersWorkload, canAssignUserToProject } from '../services/api/workload';
import type { Profile } from '../types/supabase';
import type { WorkloadData } from '../services/api/workload';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [workloadMap, setWorkloadMap] = useState<Map<string, WorkloadData>>(new Map());
  const [assignmentCheck, setAssignmentCheck] = useState<{
    canAssign: boolean;
    reason?: string;
    currentUtilization: number;
  } | null>(null);

  // Fetch all internal users
  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['internal-users'],
    queryFn: getInternalUsers,
    enabled: isOpen,
  });

  // Fetch current team members to filter them out
  const { data: currentMembers = [] } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => getProjectMembers(projectId),
    enabled: isOpen,
  });

  // Filter out users who are already team members
  const currentMemberIds = new Set(currentMembers.map(m => m.profile_id));
  const availableUsers = allUsers.filter(user => !currentMemberIds.has(user.id));

  // Load workload data for all available users
  useEffect(() => {
    if (availableUsers.length > 0) {
      const userIds = availableUsers.map(u => u.id);
      getMultipleUsersWorkload(userIds)
        .then(map => setWorkloadMap(map))
        .catch(error => console.error('Error loading workload data:', error));
    }
  }, [availableUsers.length]);

  // Check if selected user can be assigned to this project
  useEffect(() => {
    if (selectedUserId) {
      canAssignUserToProject(selectedUserId, projectId, 120) // Allow up to 120% utilization with warning
        .then(check => setAssignmentCheck(check))
        .catch(error => {
          console.error('Error checking assignment:', error);
          setAssignmentCheck(null);
        });
    } else {
      setAssignmentCheck(null);
    }
  }, [selectedUserId, projectId]);

  const addMemberMutation = useMutation({
    mutationFn: addProjectMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      toast.success('Team member added successfully!');
      handleClose();
    },
    onError: (error: any) => {
      toast.error(`Failed to add team member: ${error.message}`);
      setLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast.error('Please select a team member');
      return;
    }

    setLoading(true);

    addMemberMutation.mutate({
      project_id: projectId,
      profile_id: selectedUserId,
      role: role.trim() || null,
    });
  };

  const handleClose = () => {
    setSelectedUserId('');
    setRole('');
    setLoading(false);
    setAssignmentCheck(null);
    onClose();
  };

  // Get utilization color
  const getUtilizationColor = (percentage: number) => {
    if (percentage < 80) return 'text-green-400';
    if (percentage < 100) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get utilization badge
  const getUtilizationBadge = (percentage: number) => {
    if (percentage < 80) return 'bg-green-500/20 text-green-400';
    if (percentage < 100) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-border flex-shrink-0">
          <h2 className="text-xl font-bold text-foreground">Add Team Member</h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={loading}
          >
            <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
          {usersLoading ? (
            <div className="text-muted-foreground text-center py-8">Loading team members...</div>
          ) : availableUsers.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              All team members are already assigned to this project.
            </div>
          ) : (
            <>
              {/* Team Member Select with Workload */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Team Member <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2" style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#4B5563 #1F2937'
                }}>
                  {availableUsers.map((user) => {
                    const workload = workloadMap.get(user.id);
                    const utilization = workload?.utilization_percentage || 0;
                    const isSelected = selectedUserId === user.id;

                    return (
                      <div
                        key={user.id}
                        onClick={() => setSelectedUserId(user.id)}
                        className={`
                          p-3 rounded-lg border cursor-pointer transition-colors
                          ${isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-input bg-muted hover:border-gray-500'
                          }
                         text-primary-foreground`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-foreground font-medium">
                                {user.full_name || user.email}
                              </span>
                              <span className="text-xs text-muted-foreground capitalize">
                                ({user.role})
                              </span>
                            </div>
                            {workload && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {workload.assigned_tasks} tasks · {workload.assigned_projects} projects · {workload.total_planned_hours.toFixed(1)}h planned
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {workload && (
                              <span className={`text-sm font-semibold ${getUtilizationColor(utilization)}`}>
                                {utilization.toFixed(0)}%
                              </span>
                            )}
                            <div className={`w-3 h-3 rounded-full border-2 ${
                              isSelected ? 'border-primary bg-primary' : 'border-gray-500'
                            } text-primary-foreground`} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Utilization shown as percentage of weekly capacity
                </p>
              </div>

              {/* Capacity Warning */}
              {assignmentCheck && !assignmentCheck.canAssign && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-400">Capacity Warning</p>
                      <p className="text-xs text-yellow-300 mt-1">
                        {assignmentCheck.reason}. Current utilization: {assignmentCheck.currentUtilization.toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You can still add this member, but they may be overloaded.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Indicator */}
              {assignmentCheck && assignmentCheck.canAssign && selectedUserId && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-400">Capacity Available</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Current utilization: {assignmentCheck.currentUtilization.toFixed(0)}%. This member has capacity for this project.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Role Input */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Project Role
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Lead Developer, Designer, QA"
                  className="w-full bg-muted border border-input text-foreground placeholder-gray-400 text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Optional: Specify their role in this project
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={loading || !selectedUserId}
                >
                  {loading ? (
                    <>
                      <Icon path="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Icon path="M12 4v16m8-8H4" className="w-5 h-5" />
                      Add Member
                    </>
                  )}
                </button>
              </div>
            </>
          )}
          </div>
        </form>
      </div>
    </div>
  );
};
