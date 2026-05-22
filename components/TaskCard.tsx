import React from 'react';
import type { Task, Project } from '../types/supabase';
import { TaskStatus } from '../types/supabase';
import { Icon } from './ui/Icon';
import { Avatar } from './ui/Avatar';
import { Card } from './ui/Card';
import { useAuth } from '../lib/AuthContext';

export const taskStatusStyles: { [key in TaskStatus]: string } = {
  [TaskStatus.Todo]: 'bg-secondary text-secondary-foreground',
  [TaskStatus.InProgress]: 'bg-primary/20 text-primary',
  [TaskStatus.Review]: 'bg-accent/20 text-accent',
  [TaskStatus.Done]: 'bg-emerald-500/20 text-emerald-600',
};

interface TaskCardProps {
  task: Task;
  project?: Project;
  onEdit: (task: Task) => void;
  onTimeTrack: (task: Task) => void;
  onSelectProject?: (project: Project) => void;
  onDelete?: (task: Task) => void;
  onDuplicate?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  project,
  onEdit,
  onTimeTrack,
  onSelectProject,
  onDelete,
  onDuplicate
}) => {
  const { profile } = useAuth();
  const isClient = profile?.role === 'client';
  
  // Clients can never edit tasks once created. The PJM takes over.
  const isAdminPJM = profile?.role === 'admin' || profile?.role === 'pjm' || profile?.role === 'superadmin';
  const canEdit = !isClient && (isAdminPJM || task.created_by === profile?.id);
  const canDelete = canEdit;

  // Check if client is assigned
  const isAssignedToTask = task.assignee_ids?.includes(profile?.id || '') || task.assignee?.id === profile?.id;
  const canSeeFinancesAndTeam = !isClient || isAssignedToTask;

  const getAllDates = () => {
    const dates: { label: string, date: string, isOverdue: boolean }[] = [];
    if (task.start_date) dates.push({ label: 'Start', date: task.start_date, isOverdue: false });
    if (task.due_date) dates.push({ label: 'Final', date: task.due_date, isOverdue: false });
    
    if (task.custom_dates && task.custom_dates.length > 0) {
      task.custom_dates.forEach(cd => {
        if (cd.date && cd.name.trim() !== '') {
          dates.push({ label: cd.name, date: cd.date, isOverdue: false });
        }
      });
    } else {
      // fallback for legacy
      if (task.review_date) dates.push({ label: 'Freigabe', date: task.review_date, isOverdue: false });
      if (task.revision_date) dates.push({ label: 'Änderungen', date: task.revision_date, isOverdue: false });
    }

    const now = new Date();
    dates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    dates.forEach(d => {
      d.isOverdue = task.status !== TaskStatus.Done && new Date(d.date) < now;
    });

    return dates;
  };

  const datesList = getAllDates();

  return (
    <Card className="hover:border-primary transition-all duration-200 flex flex-col h-full bg-card border-border shadow-sm hover:shadow-md">
      <div className="flex-1">
        {/* Header: Title + Status Badge */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-foreground pr-2 line-clamp-2">
            {task.title}
          </h3>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${taskStatusStyles[task.status!] || 'bg-muted text-muted-foreground'}`}>
            {task.status?.replace('_', ' ')}
          </span>
        </div>

        {/* Project Badge */}
        {project && onSelectProject && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectProject(project);
            }}
            className="inline-flex items-center gap-1.5 mb-3 text-sm hover:underline"
            style={{ color: project.color_code || '#ffffff' }}
          >
            <Icon path="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" className="w-4 h-4" />
            {project.title}
          </button>
        )}
        {project && !onSelectProject && (
          <div
            className="inline-flex items-center gap-1.5 mb-3 text-sm"
            style={{ color: project.color_code || '#ffffff' }}
          >
            <Icon path="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" className="w-4 h-4" />
            {project.title}
          </div>
        )}

        {/* Service Badge & Materials */}
        <div className="flex flex-wrap gap-2 mb-3">
          {canSeeFinancesAndTeam && task.service_module && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 bg-primary/10 border border-primary/30 rounded text-primary">
              <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" className="w-3 h-3" />
              <span>{(task.service_module as any).service_module}</span>
              {task.estimated_hours && (
                <span className="text-muted-foreground">• {task.estimated_hours}h</span>
              )}
            </div>
          )}
          
          {task.materials && task.materials.length > 0 && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-amber-600">
              <Icon path="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" className="w-3 h-3" />
              <span>{task.materials.length} Material{task.materials.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          {task.depends_on_task_ids && task.depends_on_task_ids.length > 0 && task.status !== TaskStatus.Done && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 bg-red-500/10 border border-red-500/30 rounded text-red-500" title="This task depends on other tasks">
              <Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" className="w-3 h-3" />
              <span>Blocked by {task.depends_on_task_ids.length} task{task.depends_on_task_ids.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Description Preview */}
        {task.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Brand & Show / Freigabelink */}
        {(task.brand || task.show || task.freigabelink) && (
          <div className="flex flex-col gap-2 mb-3 bg-muted/20 p-2 rounded border border-border">
            {(task.brand || task.show) && (
              <div className="text-xs text-foreground font-medium flex items-center gap-1">
                 <Icon path="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" className="w-3 h-3 text-primary" />
                 {task.brand && <span>{task.brand}</span>}
                 {task.brand && task.show && <span className="text-muted-foreground mx-1">/</span>}
                 {task.show && <span className="text-muted-foreground">{task.show}</span>}
              </div>
            )}
            {task.freigabelink && (
              <a 
                href={task.freigabelink} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-primary hover:text-blue-400 flex items-center gap-1 transition-colors hover:underline"
              >
                 <Icon path="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" className="w-3 h-3" />
                 Review / Approval Link
              </a>
            )}
          </div>
        )}

        {/* Assignees */}
        {canSeeFinancesAndTeam && (
          <div className="flex items-center gap-2 mb-3">
            <Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" className="w-4 h-4 text-muted-foreground" />
            {task.assignees && task.assignees.length > 0 ? (
              <div className="flex items-center -space-x-2">
                {task.assignees.map((assignee, index) => (
                  <div key={assignee.id || index} className="relative group" style={{ zIndex: 10 - index }}>
                    <Avatar
                      avatarPath={assignee.avatar_url}
                      alt={assignee.full_name || ''}
                      className="w-6 h-6 rounded-full border-2 border-card relative"
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs rounded px-2 py-1 -top-8 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap z-50 shadow-md border border-border">
                      {assignee.full_name || assignee.email}
                    </div>
                  </div>
                ))}
              </div>
            ) : task.assignee ? (
              <div className="flex items-center gap-2">
                <Avatar
                  avatarPath={task.assignee.avatar_url}
                  alt={task.assignee.full_name || ''}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm text-foreground">{task.assignee.full_name}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Unassigned</span>
            )}
          </div>
        )}

        {/* All Dates */}
        {datesList.length > 0 ? (
          <div className="flex flex-col gap-1.5 mt-1">
            {datesList.map((d, i) => (
              <div key={i} className="flex items-start gap-2">
                <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-4 h-4 text-muted-foreground mt-[3px] shrink-0" />
                <span className={`text-sm leading-snug ${d.isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                  <span className="font-semibold text-foreground/80">{d.label}: </span>
                  {new Date(d.date).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} Uhr
                  {d.isOverdue && ' (Überfällig)'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Kein Datum</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTimeTrack(task);
          }}
          className="flex-1 p-2 text-emerald-600 hover:text-emerald-700 hover:bg-muted rounded-lg transition-colors flex items-center justify-center gap-2"
          title="Track time"
        >
          <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5" />
          <span className="text-sm font-medium">Track Time</span>
        </button>
        {canEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
            title="Edit task"
          >
            <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-5 h-5" />
          </button>
        )}
        {canEdit && onDuplicate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(task);
            }}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
            title="Duplicate task"
          >
            <Icon path="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" className="w-5 h-5" />
          </button>
        )}
        {canDelete && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Möchtest du diesen Task wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
                onDelete(task);
              }
            }}
            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete task"
          >
            <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-5 h-5" />
          </button>
        )}
      </div>
    </Card>
  );
};
