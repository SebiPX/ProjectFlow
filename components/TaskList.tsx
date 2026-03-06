
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Project, Task } from '../types/supabase';
import { TaskStatus } from '../types/supabase';
import { getTasks } from '../services/api/tasks';
import { getProjects } from '../services/api/projects';
import { useAuth } from '../lib/AuthContext';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { TaskFormModal } from './TaskFormModal';
import { TaskEditModal } from './TaskEditModal';
import { TimeTrackingModal } from './TimeTrackingModal';
import { TaskCard } from './TaskCard';
import { KanbanBoard } from './KanbanBoard';

interface TaskListProps {
  onSelectProject: (project: Project) => void;
  searchQuery?: string;
}

interface TaskFilters {
  status: TaskStatus | 'all';
  projectId: string | 'all';
  assigneeId: string | 'all' | 'unassigned';
}

interface TaskSort {
  field: 'title' | 'due_date' | 'status' | 'created_at';
  direction: 'asc' | 'desc';
}

export const TaskList: React.FC<TaskListProps> = ({ onSelectProject, searchQuery = '' }) => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [trackingTask, setTrackingTask] = useState<Task | null>(null);
  const [onlyMe, setOnlyMe] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'board'>('grid');

  const [filters, setFilters] = useState<TaskFilters>({
    status: 'all',
    projectId: 'all',
    assigneeId: 'all',
  });
  const [sort, setSort] = useState<TaskSort>({
    field: 'created_at',
    direction: 'desc',
  });

  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ['tasks'],
    queryFn: getTasks,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  // Filter Logic
  const filterTasks = (tasks: Task[]): Task[] => {
    return tasks.filter(task => {
      // Only Me filter
      if (onlyMe && task.assigned_to !== user?.id) return false;

      // Search Query Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      if (filters.status !== 'all' && task.status !== filters.status) return false;
      if (filters.projectId !== 'all' && task.project_id !== filters.projectId) return false;
      if (filters.assigneeId === 'unassigned' && task.assigned_to !== null) return false;
      if (filters.assigneeId !== 'all' && filters.assigneeId !== 'unassigned' && task.assigned_to !== filters.assigneeId) return false;
      return true;
    });
  };

  // Sort Logic
  const sortTasks = (tasks: Task[]): Task[] => {
    return [...tasks].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sort.field) {
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        case 'due_date':
          // Put null values at the end
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          aValue = new Date(a.due_date).getTime();
          bValue = new Date(b.due_date).getTime();
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'created_at':
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
          break;
      }

      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Apply filters and sorting
  const filteredAndSortedTasks = sortTasks(filterTasks(tasks));

  // Get active filter count
  const getActiveFilterCount = (): number => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.projectId !== 'all') count++;
    if (filters.assigneeId !== 'all') count++;
    return count;
  };

  // Get unique assignees from tasks
  const uniqueAssignees = Array.from(
    new Set(tasks.filter(t => t.assignee).map(t => t.assigned_to))
  ).map(assigneeId => {
    const assignee = tasks.find(t => t.assigned_to === assigneeId)?.assignee;
    return { id: assigneeId, name: assignee?.full_name || 'Unknown' };
  });

  if (tasksLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">All Tasks</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="h-64 animate-pulse bg-gray-800">
              <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (tasksError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500 text-xl">Error loading tasks. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">All Tasks</h1>
          <p className="text-sm text-gray-400 mt-1">
            {filteredAndSortedTasks.length} {filteredAndSortedTasks.length === 1 ? 'task' : 'tasks'}
            {getActiveFilterCount() > 0 && ' (filtered)'}
            {onlyMe && ' • Only Me'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="bg-gray-800 p-1 rounded-lg border border-gray-700 flex">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              title="Grid View"
            >
              <Icon path="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`p-2 rounded transition-colors ${viewMode === 'board'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              title="Board View (Kanban)"
            >
              <Icon path="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => setOnlyMe(!onlyMe)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${onlyMe
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
          >
            <Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" className="w-5 h-5" />
            <span className="hidden sm:inline">Only Me</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center"
          >
            <Icon path="M12 6v6m0 0v6m0-6h6m-6 0H6" className="h-5 w-5 mr-2" />
            New Task
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Status Filter - Hide in Board View as it filters redundant columns */}
          {viewMode === 'grid' && (
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
              >
                <option value="all">All Statuses</option>
                <option value={TaskStatus.Todo}>To Do</option>
                <option value={TaskStatus.InProgress}>In Progress</option>
                <option value={TaskStatus.Review}>Review</option>
                <option value={TaskStatus.Done}>Done</option>
              </select>
            </div>
          )}

          {/* Project Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Project
            </label>
            <select
              value={filters.projectId}
              onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Assigned To
            </label>
            <select
              value={filters.assigneeId}
              onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
            >
              <option value="all">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {uniqueAssignees.map(assignee => (
                <option key={assignee.id || `unknown-assignee-${Math.random()}`} value={assignee.id}>
                  {assignee.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown - Grid Only */}
          {viewMode === 'grid' && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Sort By
              </label>
              <div className="flex gap-2">
                <select
                  value={sort.field}
                  onChange={(e) => setSort({ ...sort, field: e.target.value as any })}
                  className="flex-1 bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
                >
                  <option value="created_at">Date Created</option>
                  <option value="title">Task Name</option>
                  <option value="due_date">Due Date</option>
                  <option value="status">Status</option>
                </select>
                <button
                  onClick={() => setSort({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
                  className="bg-gray-700 border border-gray-600 text-gray-300 hover:text-white hover:bg-gray-600 rounded-lg p-2.5 transition-colors"
                  title={`Sort ${sort.direction === 'asc' ? 'ascending' : 'descending'}`}
                >
                  <Icon
                    path={sort.direction === 'asc'
                      ? "M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                      : "M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                    }
                    className="w-5 h-5"
                  />
                </button>
              </div>
            </div>
          )}

          {/* Clear Filters Button */}
          {getActiveFilterCount() > 0 && (
            <div>
              <button
                onClick={() => setFilters({ status: 'all', projectId: 'all', assigneeId: 'all' })}
                className="bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg px-4 py-2.5 flex items-center gap-2 transition-colors"
              >
                <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
                Clear ({getActiveFilterCount()})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid or Board or Empty */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="text-center text-gray-400 mt-12">
          <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-xl mb-2">
            {getActiveFilterCount() > 0 ? 'No tasks match your filters' : 'No tasks found'}
          </p>
          <p className="mt-2">
            {getActiveFilterCount() > 0
              ? 'Try adjusting your filters or create a new task'
              : 'Create your first task to get started!'}
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-6">
              {filteredAndSortedTasks.map(task => {
                const project = projects.find(p => p.id === task.project_id);
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    project={project}
                    onEdit={setEditingTask}
                    onTimeTrack={setTrackingTask}
                    onSelectProject={onSelectProject}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex-grow overflow-hidden pb-4">
              <KanbanBoard
                tasks={filteredAndSortedTasks}
                projects={projects}
                onSelectProject={onSelectProject}
              />
            </div>
          )}
        </>
      )}

      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

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
