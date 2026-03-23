
import React, { useState } from 'react';
import type { Task, Project } from '../types/supabase';
import { TaskStatus } from '../types/supabase';
import { TaskCard } from './TaskCard';
import { TaskEditModal } from './TaskEditModal';
import { TimeTrackingModal } from './TimeTrackingModal';

interface KanbanBoardProps {
  tasks: Task[];
  projects?: Project[];
  currentProject?: Project;
  onSelectProject?: (project: Project) => void;
}

const columns: { status: TaskStatus, title: string }[] = [
  { status: TaskStatus.Todo, title: 'To Do' },
  { status: TaskStatus.InProgress, title: 'In Progress' },
  { status: TaskStatus.Review, title: 'Review' },
  { status: TaskStatus.Done, title: 'Done' },
];

const statusStyles = {
  [TaskStatus.Todo]: 'bg-secondary',
  [TaskStatus.InProgress]: 'bg-primary',
  [TaskStatus.Review]: 'bg-accent',
  [TaskStatus.Done]: 'bg-emerald-500',
};

const KanbanColumn: React.FC<{
  status: TaskStatus,
  title: string,
  tasks: Task[],
  projects?: Project[],
  currentProject?: Project,
  onEditTask: (task: Task) => void,
  onTimeTrack: (task: Task) => void,
  onSelectProject?: (project: Project) => void
}> = ({ status, title, tasks, projects, currentProject, onEditTask, onTimeTrack, onSelectProject }) => {
  return (
    <div className="w-80 bg-muted/30 rounded-lg flex flex-col flex-shrink-0 border border-border">
      <div className="flex items-center justify-between p-3 border-b-2 border-border mb-2">
        <div className="flex items-center">
          <span className={`w-3 h-3 rounded-full mr-2 ${statusStyles[status]}`}></span>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <span className="text-sm font-medium bg-muted text-muted-foreground rounded-full px-2 py-0.5">{tasks.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 kanban-column min-h-[100px]">
        {tasks.map(task => {
          const project = currentProject || projects?.find(p => p.id === task.project_id);
          return (
            <TaskCard
              key={task.id}
              task={task}
              project={project}
              onEdit={onEditTask}
              onTimeTrack={onTimeTrack}
              onSelectProject={onSelectProject}
            />
          );
        })}
      </div>
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, projects, currentProject, onSelectProject }) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [trackingTask, setTrackingTask] = useState<Task | null>(null);

  // Filter tasks that actually have a valid status, or fallback to Todo if needed
  // But usually we just filter by matching column status

  return (
    <>
      <div className="flex h-full p-4 space-x-4 overflow-x-auto items-start">
        {columns.map(col => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            title={col.title}
            tasks={tasks.filter(t => t.status === col.status)}
            projects={projects}
            currentProject={currentProject}
            onEditTask={setEditingTask}
            onTimeTrack={setTrackingTask}
            onSelectProject={onSelectProject}
          />
        ))}
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
    </>
  );
};
