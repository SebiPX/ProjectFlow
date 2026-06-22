import React, { useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onDeleteTask?: (task: Task) => void;
  onDuplicateTask?: (task: Task) => void;
  projectAssets?: any[];
  onPreviewAsset?: (asset: any) => void;
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

const SortableTaskItem = ({ task, project, onEditTask, onTimeTrack, onSelectProject, onDeleteTask, onDuplicateTask, projectAssets, onPreviewAsset }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { task } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3">
            <TaskCard
              task={task}
              project={project}
              onEdit={onEditTask}
              onTimeTrack={onTimeTrack}
              onSelectProject={onSelectProject}
              onDelete={onDeleteTask}
              onDuplicate={onDuplicateTask}
              projectAssets={projectAssets}
              onPreviewAsset={onPreviewAsset}
            />
        </div>
    );
};

const KanbanColumn: React.FC<{
  status: TaskStatus,
  title: string,
  tasks: Task[],
  projects?: Project[],
  currentProject?: Project,
  onEditTask: (task: Task) => void,
  onTimeTrack: (task: Task) => void,
  onSelectProject?: (project: Project) => void,
  onDeleteTask?: (task: Task) => void,
  onDuplicateTask?: (task: Task) => void,
  projectAssets?: any[],
  onPreviewAsset?: (asset: any) => void
}> = ({ status, title, tasks, projects, currentProject, onEditTask, onTimeTrack, onSelectProject, onDeleteTask, onDuplicateTask, projectAssets, onPreviewAsset }) => {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="w-80 bg-muted/30 rounded-lg flex flex-col flex-shrink-0 border border-border h-full">
      <div className="flex items-center justify-between p-3 border-b-2 border-border mb-2">
        <div className="flex items-center">
          <span className={`w-3 h-3 rounded-full mr-2 ${statusStyles[status]}`}></span>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <span className="text-sm font-medium bg-muted text-muted-foreground rounded-full px-2 py-0.5">{tasks.length}</span>
      </div>
      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-3 kanban-column min-h-[150px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => {
            const project = currentProject || projects?.find(p => p.id === task.project_id);
            return (
              <SortableTaskItem
                key={task.id}
                task={task}
                project={project}
                onEditTask={onEditTask}
                onTimeTrack={onTimeTrack}
                onSelectProject={onSelectProject}
                onDeleteTask={onDeleteTask}
                onDuplicateTask={onDuplicateTask}
                projectAssets={projectAssets}
                onPreviewAsset={onPreviewAsset}
              />
            );
          })}
          {tasks.length === 0 && (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg py-8">
              Drop here
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, projects, currentProject, onSelectProject, onStatusChange, onDeleteTask, onDuplicateTask, projectAssets = [], onPreviewAsset }) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [trackingTask, setTrackingTask] = useState<Task | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
      useSensor(PointerSensor, {
          activationConstraint: {
              distance: 8,
          }
      }),
      useSensor(KeyboardSensor, {
          coordinateGetter: sortableKeyboardCoordinates,
      })
  );

  const handleDragStart = (event: DragStartEvent) => {
      if (!onStatusChange) return; // If no handler, prevent dragging or just don't do anything
      const { active } = event;
      setActiveId(active.id as string);
      setActiveTask(active.data.current?.task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setActiveTask(null);

      if (!over || !onStatusChange) return;

      const draggedTask = active.data.current?.task as Task;
      const overId = over.id as string;

      const isStatusColumn = Object.values(TaskStatus).includes(overId as any);

      if (draggedTask && isStatusColumn && draggedTask.status !== overId) {
          onStatusChange(draggedTask.id, overId as TaskStatus);
      }
  };

  return (
    <>
      <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
      >
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
              onDeleteTask={onDeleteTask}
              onDuplicateTask={onDuplicateTask}
              projectAssets={projectAssets}
              onPreviewAsset={onPreviewAsset}
            />
          ))}
        </div>

        <DragOverlay>
            {activeTask ? (
                <div className="cursor-grabbing rotate-2 scale-105 shadow-2xl">
                  <TaskCard
                      task={activeTask}
                      project={currentProject || projects?.find(p => p.id === activeTask.project_id)}
                      onEdit={() => {}}
                      onTimeTrack={() => {}}
                      projectAssets={projectAssets}
                      onPreviewAsset={onPreviewAsset}
                  />
                </div>
            ) : null}
        </DragOverlay>
      </DndContext>

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
