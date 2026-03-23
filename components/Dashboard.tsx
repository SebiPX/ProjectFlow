
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import type { Project } from '../types/supabase';
import { ProjectStatus } from '../types/supabase';
import { getTasks } from '../services/api/tasks';
import { getProjects, getProjectsFinancialOverview } from '../services/api/projects';
import { getTimeEntries } from '../services/api/timeEntries';
import { NewsWidget } from './NewsWidget';

interface DashboardProps {
  onSelectProject: (project: Project) => void;
}

const statusColors: { [key in ProjectStatus]: string } = {
  [ProjectStatus.Active]: '#3b82f6',
  [ProjectStatus.Completed]: '#10b981',
  [ProjectStatus.Planned]: '#f97316',
  [ProjectStatus.OnHold]: '#f59e0b',
  [ProjectStatus.Cancelled]: '#ef4444',
};

export const Dashboard: React.FC<DashboardProps> = ({ onSelectProject }) => {
  // Fetch projects from Supabase
  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  // Fetch time entries from Supabase
  const { data: timeEntries = [], isLoading: timeEntriesLoading } = useQuery({
    queryKey: ['timeEntries'],
    queryFn: getTimeEntries,
  });

  // Fetch tasks for overdue count
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: getTasks,
  });

  // Fetch financial overview for spent calculation
  const { data: financialOverview = {} } = useQuery({
    queryKey: ['projects-financial-overview'],
    queryFn: getProjectsFinancialOverview,
  });

  // Calculate statistics
  const totalBudget = projects.reduce((sum, p) => sum + (Number(p.budget_total) || 0), 0);
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalHoursTracked = timeEntries.reduce((sum, t) => sum + (Number(t.duration_minutes) || 0), 0) / 60;

  const overdueTasksCount = tasks.filter(t => {
    if (!t.due_date || t.status === 'done') return false;
    const dueDate = new Date(t.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compare dates only
    return dueDate < today;
  }).length;

  // Prepare chart data

  const statusData = Object.values(ProjectStatus).map(status => ({
    name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
    value: projects.filter(p => p.status === status).length,
  }));

  // Show loading state
  if (projectsLoading || timeEntriesLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground text-xl">Loading dashboard...</div>
      </div>
    );
  }

  // Show error state
  if (projectsError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive text-xl">Error loading dashboard data. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Icon path="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-muted-foreground">Active Projects</p>
              <p className="text-2xl font-bold text-foreground">{activeProjects}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-600">
              <Icon path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold text-foreground">€{totalBudget.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-500/10 text-orange-500">
              <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-muted-foreground">Hours Tracked (All)</p>
              <p className="text-2xl font-bold text-foreground">{totalHoursTracked.toFixed(1)}h</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-destructive/10 text-destructive">
              <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-muted-foreground">Overdue Tasks</p>
              <p className="text-2xl font-bold text-foreground">{overdueTasksCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts & News */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NewsWidget />
        </div>
        
        <div className="flex flex-col gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-foreground">Project Status</h3>
            <div className="h-[280px] mt-4 w-full relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={statusColors[entry.name.toLowerCase().replace(' ', '_') as ProjectStatus]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} itemStyle={{ color: 'var(--foreground)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Projects Table */}
      <Card>
        <h3 className="text-lg font-semibold text-foreground mb-4">Active Projects</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-muted-foreground">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th scope="col" className="px-6 py-3">Project Name</th>
                <th scope="col" className="px-6 py-3">Client</th>
                <th scope="col" className="px-6 py-3">Deadline</th>
                <th scope="col" className="px-6 py-3">Budget</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.filter(p => p.status === 'active').map(project => (
                <tr key={project.id} className="bg-card border-b border-border hover:bg-muted/30">
                  <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">{project.title}</td>
                  <td className="px-6 py-4">{project.client?.company_name}</td>
                  <td className="px-6 py-4">{project.deadline}</td>
                  <td className="px-6 py-4">€{project.budget_total?.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full`} style={{ backgroundColor: `${statusColors[project.status!]}33`, color: statusColors[project.status!] }}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => onSelectProject(project)} className="font-medium text-primary hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
