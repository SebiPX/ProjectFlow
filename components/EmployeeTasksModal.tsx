import React, { useState } from 'react';
import type { Profile, Task } from '../types/supabase';
import { useQuery } from '@tanstack/react-query';
import { getTasks } from '../services/api/tasks';
import { getProjects } from '../services/api/projects';
import { TaskCard } from './TaskCard';
import { Icon } from './ui/Icon';
import { TaskEditModal } from './TaskEditModal';
import { TimeTrackingModal } from './TimeTrackingModal';

interface EmployeeTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Profile;
}

export const EmployeeTasksModal: React.FC<EmployeeTasksModalProps> = ({ isOpen, onClose, employee }) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [trackingTask, setTrackingTask] = useState<Task | null>(null);

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: getTasks,
    enabled: isOpen,
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    enabled: isOpen,
  });

  if (!isOpen) return null;

  // Filter tasks for this employee
  const employeeTasks = tasks.filter(task => {
    if (task.assignee_ids?.includes(employee.id)) return true;
    if (task.assignees?.some(a => a.id === employee.id)) return true;
    if (task.assignee?.id === employee.id) return true;
    if (task.assignee_id === employee.id) return true;
    if (task.assigned_to === employee.id) return true;
    if (Array.isArray(task.assigned_to) && task.assigned_to.includes(employee.id)) return true;
    return false;
  });

  // Sort tasks: Incomplete first, then by date, etc.
  employeeTasks.sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Tasks for {employee.full_name || employee.email}</h2>
            <p className="text-sm text-muted-foreground mt-1">{employeeTasks.length} assigned task{employeeTasks.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full"
          >
            <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto bg-muted/30">
          {tasksLoading || projectsLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-card rounded-lg h-48 animate-pulse shadow-sm border border-border"></div>
                ))}
            </div>
          ) : employeeTasks.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center">
               <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
               <h3 className="text-xl font-bold text-foreground">No tasks found</h3>
               <p className="text-muted-foreground mt-2">This user currently has no assigned tasks.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {employeeTasks.map((task) => {
                const project = projects.find((p) => p.id === task.project_id);
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    project={project}
                    onEdit={setEditingTask}
                    onTimeTrack={setTrackingTask}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {editingTask && (
        <TaskEditModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          task={editingTask}
          onTimeTrack={setTrackingTask}
        />
      )}

      {trackingTask && (
        <TimeTrackingModal
          isOpen={!!trackingTask}
          onClose={() => setTrackingTask(null)}
          task={trackingTask}
        />
      )}
    </div>
  );
};
