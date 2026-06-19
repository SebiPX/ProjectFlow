
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { Avatar } from './ui/Avatar';
import type { Project } from '../types/supabase';
import { ProjectStatus } from '../types/supabase';
import { getTasks } from '../services/api/tasks';
import { getProjects, getProjectsFinancialOverview } from '../services/api/projects';
import { getTimeEntries } from '../services/api/timeEntries';
import { getProfiles } from '../services/api/profiles';
import { NewsWidget } from './NewsWidget';

interface DashboardProps {
  onSelectProject: (project: Project) => void;
}

// Helper functions for date calculations
function getWeekDates(weekNumber: number, year: number) {
  const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = new Date(simple);
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  const monday = new Date(ISOweekStart);
  const sunday = new Date(ISOweekStart);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
}

function getWeekNumber(d: Date) {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

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

  // Fetch profiles for Top 3 rankings
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: getProfiles,
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

  // Find PJM for a project
  const findProjectPJM = (p: Project) => {
    return p.project_members?.find(
      m => m.role && (m.role.toLowerCase().includes('pjm') || m.role.toLowerCase().includes('projektleitung'))
    );
  };

  // Filter profiles for creatives
  const creatives = profiles.filter(p => p.role === 'creative');

  // Helper to check task assignments
  const isAssigned = (task: any, profileId: string) => {
    if (task.assignee_ids?.includes(profileId)) return true;
    if (task.assignee_id === profileId) return true;
    if (task.assignee?.id === profileId) return true;
    if (task.assignees?.some((a: any) => a.id === profileId)) return true;
    return false;
  };

  // Top 3 Creatives with tasks in progress
  const creativesInProgress = creatives.map(profile => {
    const count = tasks.filter(t => t.status === 'in_progress' && isAssigned(t, profile.id)).length;
    return {
      id: profile.id,
      name: profile.full_name || 'Unknown Creative',
      avatarUrl: profile.avatar_url || '',
      count,
    };
  })
  .sort((a, b) => b.count - a.count)
  .slice(0, 3);

  // Top 3 Creatives with tasks todo
  const creativesTodo = creatives.map(profile => {
    const count = tasks.filter(t => t.status === 'todo' && isAssigned(t, profile.id)).length;
    return {
      id: profile.id,
      name: profile.full_name || 'Unknown Creative',
      avatarUrl: profile.avatar_url || '',
      count,
    };
  })
  .sort((a, b) => b.count - a.count)
  .slice(0, 3);

  // PJM Counts
  const pjmCounts: { [id: string]: { name: string; avatarUrl: string; count: number } } = {};
  
  projects.forEach(p => {
    const pjmMember = findProjectPJM(p);
    if (pjmMember && pjmMember.profile) {
      const pjmId = pjmMember.profile.id || pjmMember.profile_id || pjmMember.user_id;
      if (pjmId) {
        if (!pjmCounts[pjmId]) {
          pjmCounts[pjmId] = {
            name: pjmMember.profile.full_name || 'Unknown PJM',
            avatarUrl: pjmMember.profile.avatar_url || '',
            count: 0
          };
        }
        pjmCounts[pjmId].count += 1;
      }
    }
  });

  const topPJMs = Object.values(pjmCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Kitchen Duty calculations
  const today = new Date();
  const currentWeekNum = getWeekNumber(today);
  const currentYearNum = today.getFullYear();
  const { monday: kwStart, sunday: kwEnd } = getWeekDates(currentWeekNum, currentYearNum);

  // Load from local storage
  const [kitchenTeam, setKitchenTeam] = React.useState<any[]>([]);

  React.useEffect(() => {
    try {
      const savedDutiesStr = localStorage.getItem('px_kitchen_duty_plan');
      if (savedDutiesStr) {
        const savedDuties = JSON.parse(savedDutiesStr);
        const thisWeekDuty = savedDuties.find(
          (d: any) => d.weekNumber === currentWeekNum && d.year === currentYearNum
        );
        if (thisWeekDuty && thisWeekDuty.assignedIds && thisWeekDuty.assignedIds.length > 0) {
          const team = thisWeekDuty.assignedIds
            .map((id: string) => profiles.find((p: any) => p.id === id))
            .filter(Boolean);
          setKitchenTeam(team);
        }
      }
    } catch (e) {
      console.error('Failed to parse kitchen duties', e);
    }
  }, [profiles, currentWeekNum, currentYearNum]);

  // Show loading state
  if (projectsLoading || timeEntriesLoading || tasksLoading || profilesLoading) {
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

      {/* Top 3 Rankings Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col h-full bg-card border-border">
          <div className="flex items-center space-x-3 mb-4 pb-2 border-b border-border">
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Icon path="M9.663 17h4.673M12 3v1m6.364.364l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-foreground">Top 3 Creatives (In Progress)</h3>
          </div>
          <div className="space-y-4 flex-1">
            {creativesInProgress.length > 0 ? (
              creativesInProgress.map((creative, index) => (
                <div key={creative.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl font-bold w-6 text-center">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                    </span>
                    <Avatar avatarPath={creative.avatarUrl} alt={creative.name} size="sm" />
                    <span className="font-semibold text-foreground text-sm">{creative.name}</span>
                  </div>
                  <span className="text-xs font-bold bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded-full">
                    {creative.count} Tasks
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No tasks in progress.</p>
            )}
          </div>
        </Card>

        <Card className="flex flex-col h-full bg-card border-border">
          <div className="flex items-center space-x-3 mb-4 pb-2 border-b border-border">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-foreground">Top 3 Creatives (ToDo)</h3>
          </div>
          <div className="space-y-4 flex-1">
            {creativesTodo.length > 0 ? (
              creativesTodo.map((creative, index) => (
                <div key={creative.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl font-bold w-6 text-center">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                    </span>
                    <Avatar avatarPath={creative.avatarUrl} alt={creative.name} size="sm" />
                    <span className="font-semibold text-foreground text-sm">{creative.name}</span>
                  </div>
                  <span className="text-xs font-bold bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full">
                    {creative.count} Tasks
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No tasks in ToDo.</p>
            )}
          </div>
        </Card>

        <Card className="flex flex-col h-full bg-card border-border">
          <div className="flex items-center space-x-3 mb-4 pb-2 border-b border-border">
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <Icon path="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-foreground">Top 3 PJMs</h3>
          </div>
          <div className="space-y-4 flex-1">
            {topPJMs.length > 0 ? (
              topPJMs.map((pjm, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl font-bold w-6 text-center">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                    </span>
                    <Avatar avatarPath={pjm.avatarUrl} alt={pjm.name} size="sm" />
                    <span className="font-semibold text-foreground text-sm">{pjm.name}</span>
                  </div>
                  <span className="text-xs font-bold bg-purple-500/10 text-purple-500 px-2.5 py-1 rounded-full">
                    {pjm.count} Projects
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No PJMs assigned.</p>
            )}
          </div>
        </Card>
      </div>

      {/* News & Kitchen Duty */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NewsWidget />
        </div>
        
        <div>
          <Card className="flex flex-col h-full bg-card border-border p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                  <Icon path="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold text-foreground">🧹 Küchendienst</h3>
              </div>
              <button
                onClick={() => { window.location.hash = '#kitchen-duty'; }}
                className="text-xs text-primary font-bold hover:underline"
              >
                Planer öffnen
              </button>
            </div>
            
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-4">
                  Diensthabende in dieser Woche (KW {currentWeekNum}: {kwStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - {kwEnd.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}):
                </p>

                {kitchenTeam.length > 0 ? (
                  <div className="space-y-3">
                    {kitchenTeam.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3 p-2.5 rounded-lg bg-muted/20 border border-border/40">
                        <Avatar avatarPath={member.avatar_url} alt={member.full_name} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-foreground leading-tight">{member.full_name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{member.role || 'Mitarbeiter'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/10 rounded-lg border border-dashed border-border/80 p-4">
                    <span className="text-2xl mb-2">🤷‍♂️</span>
                    <p className="text-sm font-semibold text-foreground">Kein Dienst eingeteilt</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                      Für diese Kalenderwoche wurde noch kein Team eingeteilt.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
