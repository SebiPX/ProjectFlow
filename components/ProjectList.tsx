import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Project } from '../types/supabase';
import { ProjectStatus } from '../types/supabase';
import { getProjects, getProjectsFinancialOverview, updateProject } from '../services/api/projects';
import { toast } from 'react-toastify';
import { useAuth } from '../lib/AuthContext';
import { calculateProjectsMargins } from '../services/api/projectFinancials';
import { ClientLogo } from './ui/ClientLogo';
import { Avatar } from './ui/Avatar';
import { LayoutGrid, List, AppWindow, ArrowRight, Calendar as CalendarIcon } from 'lucide-react';

interface ProjectListProps {
  onSelectProject: (project: Project) => void;
  searchQuery?: string;
}

const statusColors: { [key in string]: string } = {
  [ProjectStatus.Active]: 'bg-primary text-primary-foreground border-primary/20',
  [ProjectStatus.Completed]: 'bg-green-500 text-white border-green-500/20',
  [ProjectStatus.Planned]: 'bg-orange-500 text-white border-orange-500/20',
  [ProjectStatus.OnHold]: 'bg-yellow-500 text-white border-yellow-500/20',
  [ProjectStatus.Cancelled]: 'bg-red-500 text-white border-red-500/20',
};

const ProjectCard: React.FC<{
  project: Project;
  onSelectProject: (project: Project) => void;
  onStatusChange?: (status: ProjectStatus) => void;
  financialData?: { costs: number; billableValue: number; total: number };
  marginData?: { profit: number; marginPercentage: number; status: string };
}> = ({ project, onSelectProject, onStatusChange, financialData, marginData }) => {
  const budget = project.budget_total || 0;
  const spent = financialData?.total || 0;
  const progress = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  const deadline = project.deadline ? new Date(project.deadline) : null;
  const isOverdue = deadline && deadline < new Date();
  const daysUntilDeadline = deadline
    ? Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div
      onClick={() => onSelectProject(project)}
      className="bg-card border border-border text-card-foreground rounded-xl p-5 flex flex-col justify-between hover:border-primary hover:shadow-md hover:shadow-primary/10 cursor-pointer transition-all duration-200"
    >
      <div>
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-foreground line-clamp-1 pr-2">{project.title}</h3>
          <select
            value={project.status || ProjectStatus.Planned}
            onChange={(e) => onStatusChange && onStatusChange(e.target.value as ProjectStatus)}
            onClick={(e) => e.stopPropagation()}
            className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full appearance-none outline-none cursor-pointer hover:opacity-80 transition-opacity ${statusColors[project.status || ProjectStatus.Planned]} border-none`}
            style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', textAlign: 'center' }}
          >
            <option value={ProjectStatus.Planned} className="bg-background text-foreground text-sm py-1">Planned</option>
            <option value={ProjectStatus.Active} className="bg-background text-foreground text-sm py-1">Active</option>
            <option value={ProjectStatus.OnHold} className="bg-background text-foreground text-sm py-1">On Hold</option>
            <option value={ProjectStatus.Completed} className="bg-background text-foreground text-sm py-1">Completed</option>
            <option value={ProjectStatus.Cancelled} className="bg-background text-foreground text-sm py-1">Cancelled</option>
          </select>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <ClientLogo
            logoPath={project.client?.logo_url}
            companyName={project.client?.company_name || 'Client'}
            className="w-5 h-5 rounded-full object-cover"
          />
          <p className="text-sm text-muted-foreground">{project.client?.company_name}</p>
        </div>

        {deadline && (
          <div className={`flex items-center gap-1 mt-3 text-xs ${isOverdue ? 'text-red-400 font-semibold' : daysUntilDeadline && daysUntilDeadline <= 7 ? 'text-yellow-500 font-semibold' : 'text-muted-foreground'}`}>
            <CalendarIcon size={14} />
            <span>
              {isOverdue
                ? `Overdue (${deadline.toLocaleDateString('de-DE')})`
                : daysUntilDeadline === 0
                  ? 'Due today'
                  : daysUntilDeadline === 1
                    ? 'Due tomorrow'
                    : `Due ${deadline.toLocaleDateString('de-DE')}`}
            </span>
          </div>
        )}

        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{project.description}</p>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-1 font-medium">
          <span>Budget Usage</span>
          <span className={progress > 100 ? 'text-destructive font-bold' : ''}>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${progress > 100 ? 'bg-destructive' : progress > 80 ? 'bg-orange-500' : 'bg-primary'} text-primary-foreground`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span className={spent > budget ? 'text-destructive font-semibold' : ''}>
            €{spent.toLocaleString(undefined, { maximumFractionDigits: 0 })} spent
          </span>
          <span>€{budget.toLocaleString()} budget</span>
        </div>

        {marginData && marginData.marginPercentage !== 0 && (
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Acc. Margin</span>
              <span
                className={`text-xs font-bold px-2 py-1 rounded-md ${marginData.status === 'excellent'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : marginData.status === 'good'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-primary dark:text-blue-400'
                    : marginData.status === 'acceptable'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                      : marginData.status === 'poor'
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}
              >
                {marginData.marginPercentage >= 0 ? '+' : ''}
                {marginData.marginPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ProjectList: React.FC<{ onSelectProject: (project: Project) => void; searchQuery?: string }> = ({ onSelectProject, searchQuery = '' }) => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const [onlyMe, setOnlyMe] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'board'>('grid');

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const { data: financialOverview = {} } = useQuery({
    queryKey: ['projects-financial-overview'],
    queryFn: getProjectsFinancialOverview,
  });

  const { data: marginsData = {} } = useQuery({
    queryKey: ['projects-margins', projects.map(p => p.id)],
    queryFn: () => calculateProjectsMargins(projects.map(p => p.id)),
    enabled: projects.length > 0,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProjectStatus }) => updateProject(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project status updated');
    },
    onError: () => toast.error('Failed to update project status')
  });

  const filteredProjects = projects.filter(project => {
    if (showArchived) {
      if (!project.is_archived) return false;
    } else if (showCompleted) {
      if (project.status !== ProjectStatus.Completed) return false;
      if (project.is_archived) return false;
    } else {
      // Default active view
      if (project.is_archived) return false;
      if (project.status === ProjectStatus.Completed) return false;
    }

    if (onlyMe) {
      const isTeamMember = project.project_members?.some(member => 
        member.profile_id === user?.id || 
        member.profile_id === profile?.id || 
        member.user_id === user?.id || 
        member.user_id === profile?.id
      );
      if (!isTeamMember) return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = project.title?.toLowerCase().includes(query);
      const matchesClient = project.client?.company_name?.toLowerCase().includes(query);
      const matchesDesc = project.description?.toLowerCase().includes(query);
      return matchesTitle || matchesClient || matchesDesc;
    }

    return true;
  });

  const groupedProjects = filteredProjects.reduce((acc, project) => {
    const clientName = project.client?.company_name || 'Ohne Kunden';
    if (!acc[clientName]) acc[clientName] = [];
    acc[clientName].push(project);
    return acc;
  }, {} as Record<string, Project[]>);

  const sortedClients = Object.keys(groupedProjects).sort((a, b) => {
    const getRank = (name: string) => {
      if (name.startsWith('Pixelschickeria')) return 3;
      if (name === 'PX AKQUISE') return 2;
      if (name === 'Ohne Kunden') return 1;
      return 0;
    };
    
    const rankA = getRank(a);
    const rankB = getRank(b);
    
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    
    return a.localeCompare(b);
  });

  const sortedProjectsFlat = sortedClients.flatMap(client => groupedProjects[client]);

  const findPJM = (p: Project) => {
    return p.project_members?.find(m => m.role && (m.role.toLowerCase().includes('pjm') || m.role.toLowerCase().includes('projektleitung')));
  };

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData('projectId', projectId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: ProjectStatus) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('projectId');
    if (!projectId) return;

    const project = projects.find(p => p.id === projectId);
    if (project && project.status !== newStatus) {
      updateMutation.mutate({ id: projectId, status: newStatus });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground text-xl flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          Loading projects...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive font-medium border border-destructive/20 bg-destructive/10 px-6 py-4 rounded-xl">
          Error loading projects. Please check your connection.
        </div>
      </div>
    );
  }

  const renderBoardView = () => {
    const columns = [
      { id: ProjectStatus.Planned, title: 'Planned' },
      { id: ProjectStatus.Active, title: 'Active' },
      { id: ProjectStatus.OnHold, title: 'On Hold' },
      ...(showCompleted ? [{ id: ProjectStatus.Completed, title: 'Completed' }] : []),
    ];

    return (
      <div className="flex gap-6 overflow-x-auto pb-4 pt-2">
        {columns.map(col => {
          const colProjects = filteredProjects.filter(p => p.status === col.id);
          const headerColors: Record<string, string> = {
            [ProjectStatus.Planned]: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800/50',
            [ProjectStatus.Active]: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50',
            [ProjectStatus.OnHold]: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800/50',
            [ProjectStatus.Completed]: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800/50'
          };
          const style = headerColors[col.id];

          return (
            <div 
              key={col.id} 
              className={`min-w-[340px] max-w-[340px] rounded-2xl flex flex-col border border-border bg-card shadow-sm`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className={`p-4 border-b rounded-t-xl flex justify-between items-center ${style}`}>
                <h3 className={`font-bold tracking-wide uppercase text-sm`}>{col.title}</h3>
                <span className="text-xs bg-background/50 backdrop-blur-md px-2 py-1 rounded-full font-bold shadow-sm">{colProjects.length}</span>
              </div>
              
              <div className="p-3 flex flex-col gap-3 overflow-y-auto max-h-[70vh] bg-muted/20 flex-1">
                {colProjects.map(p => {
                  const pjm = findPJM(p);
                  const restMembers = p.project_members?.filter(m => m.user_id !== pjm?.user_id) || [];
                  
                  return (
                    <div 
                      key={p.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, p.id)}
                      onClick={() => onSelectProject(p)}
                      className="bg-card hover:border-primary border border-border rounded-xl p-4 shadow-sm cursor-grab active:cursor-grabbing transition-all hover:-translate-y-0.5"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-full">#{p.project_number}</span>
                        {p.deadline && new Date(p.deadline) < new Date() && p.status !== ProjectStatus.Completed && (
                           <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50 animate-pulse"></span>
                        )}
                      </div>
                      <h4 className="font-bold text-foreground leading-tight hover:text-primary transition-colors text-base">{p.title}</h4>
                      <p className="text-xs text-muted-foreground mb-4 mt-1 flex items-center gap-1">
                        <ClientLogo logoPath={p.client?.logo_url} companyName={p.client?.company_name || ''} className="w-4 h-4 rounded-full" />
                        {p.client?.company_name}
                      </p>
                      
                      <div className="flex justify-between items-end mt-4 pt-4 border-t border-border/50">
                        <div className="flex items-center">
                          {pjm ? (
                            <div className="relative group/avatar" title={`PJM: ${pjm.profile?.full_name}`}>
                              <Avatar url={pjm.profile?.avatar_url || ''} alt={pjm.profile?.full_name || ''} size="sm" className="ring-2 ring-primary/50" />
                              <span className="absolute -bottom-1 -right-1 bg-primary text-[8px] font-bold text-primary-foreground px-1 rounded">PJM</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">No PJM</span>
                          )}
                          {restMembers.length > 0 && (
                            <div className="ml-2 flex -space-x-2">
                              {restMembers.slice(0, 3).map(m => (
                                <Avatar key={m.user_id} url={m.profile?.avatar_url || ''} alt={m.profile?.full_name || ''} size="xs" className="ring-2 ring-background grayscale hover:grayscale-0" />
                              ))}
                              {restMembers.length > 3 && (
                                <div className="w-5 h-5 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[8px] font-bold">
                                  +{restMembers.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {p.deadline && (
                          <div className={`text-[10px] flex items-center font-medium ${new Date(p.deadline) < new Date() && p.status !== 'completed' ? 'text-red-500 bg-red-500/10 px-2 py-1 rounded-md' : 'text-muted-foreground'}`}>
                            <CalendarIcon size={10} className="mr-1" />
                            {new Date(p.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {colProjects.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl">
                    Drop projects here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTableView = () => {
    return (
      <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden mt-2">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] uppercase tracking-wider bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-5 py-3 font-semibold">ID</th>
                <th className="px-5 py-3 font-semibold">Project</th>
                <th className="px-5 py-3 font-semibold">PJM / Lead</th>
                <th className="px-5 py-3 font-semibold">Team</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Deadline</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {sortedClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">No projects found matching the criteria.</td>
                </tr>
              ) : (
                sortedClients.map(clientName => {
                  const clientProjects = groupedProjects[clientName];
                  const firstProject = clientProjects[0];
                  
                  return (
                    <React.Fragment key={clientName}>
                      {/* Client Group Header */}
                      <tr className="bg-muted/20 border-y border-border">
                        <td colSpan={7} className="px-5 py-3 font-bold text-foreground">
                          <div className="flex items-center gap-2">
                            {firstProject?.client?.logo_url && clientName !== 'Ohne Kunden' && (
                              <ClientLogo logoPath={firstProject.client.logo_url} companyName={clientName} className="w-5 h-5 rounded-full" />
                            )}
                            <span className="text-sm">{clientName}</span>
                            <span className="text-[10px] font-semibold bg-background border border-border text-muted-foreground px-2 rounded-full ml-1">{clientProjects.length}</span>
                          </div>
                        </td>
                      </tr>
                      {/* Projects for this Client */}
                      {clientProjects.map(p => {
                        const pjm = findPJM(p);
                        return (
                          <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                            <td className="px-5 py-3 font-mono text-xs text-muted-foreground">#{p.project_number}</td>
                            <td className="px-5 py-3 font-medium text-foreground">
                              <button onClick={() => onSelectProject(p)} className="hover:text-primary transition-colors text-left flex flex-col">
                                <span>{p.title}</span>
                              </button>
                            </td>
                            <td className="px-5 py-3">
                              {pjm ? (
                                <div className="flex items-center space-x-2" title={pjm.role || ''}>
                                   <Avatar url={pjm.profile?.avatar_url || ''} alt={pjm.profile?.full_name || ''} size="xs" />
                                   <span className="font-medium text-xs">{pjm.profile?.full_name}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic text-[10px]">Unassigned</span>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex -space-x-2">
                                 {p.project_members?.filter(m => m.user_id !== pjm?.user_id).slice(0, 4).map(m => (
                                   <div key={m.user_id} title={m.profile?.full_name || ''}>
                                     <Avatar url={m.profile?.avatar_url || ''} alt={m.profile?.full_name || ''} size="xs" className="ring-2 ring-background w-6 h-6" />
                                   </div>
                                 ))}
                                 {p.project_members && p.project_members.length > (pjm ? 5 : 4) && (
                                    <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[8px] font-bold z-0">
                                      +{(p.project_members.length - (pjm ? 1 : 0)) - 4}
                                    </div>
                                 )}
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              <select
                                value={p.status || ProjectStatus.Planned}
                                onChange={(e) => updateMutation.mutate({ id: p.id, status: e.target.value as ProjectStatus })}
                                onClick={(e) => e.stopPropagation()}
                                className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md border appearance-none outline-none cursor-pointer hover:opacity-80 transition-opacity ${statusColors[p.status || ProjectStatus.Planned]}`}
                                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', textAlign: 'center' }}
                              >
                                <option value={ProjectStatus.Planned} className="bg-background text-foreground text-sm py-1">Planned</option>
                                <option value={ProjectStatus.Active} className="bg-background text-foreground text-sm py-1">Active</option>
                                <option value={ProjectStatus.OnHold} className="bg-background text-foreground text-sm py-1">On Hold</option>
                                <option value={ProjectStatus.Completed} className="bg-background text-foreground text-sm py-1">Completed</option>
                                <option value={ProjectStatus.Cancelled} className="bg-background text-foreground text-sm py-1">Cancelled</option>
                              </select>
                            </td>
                            <td className="px-5 py-3 text-right text-muted-foreground text-xs font-medium">
                              {p.deadline ? new Date(p.deadline).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-5 py-3 text-right">
                               <button onClick={() => onSelectProject(p)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                                  <ArrowRight size={16} />
                               </button>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredProjects.length} active {filteredProjects.length === 1 ? 'project' : 'projects'}
            {onlyMe && ' • Only Me'}
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-muted/30 p-1.5 rounded-xl border border-border">
          {/* View Toggles */}
          <div className="flex items-center space-x-1 border-r border-border pr-3 mr-1">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded-lg flex items-center transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-primary ring-1 ring-border' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
              title="Grid View (Cards)"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('table')} 
              className={`p-2 rounded-lg flex items-center transition-all ${viewMode === 'table' ? 'bg-background shadow-sm text-primary ring-1 ring-border' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
              title="Table View (Airtable Style)"
            >
              <List size={16} />
            </button>
            <button 
              onClick={() => setViewMode('board')} 
              className={`p-2 rounded-lg flex items-center transition-all ${viewMode === 'board' ? 'bg-background shadow-sm text-primary ring-1 ring-border' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
              title="Board View (Kanban Style)"
            >
              <AppWindow size={16} />
            </button>
          </div>

          <button
            onClick={() => setOnlyMe(!onlyMe)}
            className={`font-semibold py-1.5 px-3 rounded-lg text-sm flex items-center transition-colors ${onlyMe
              ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
              : 'bg-background hover:bg-muted text-muted-foreground border border-border'
              }`}
          >
            Only Me
          </button>
          <button
            onClick={() => {
              setShowCompleted(!showCompleted);
              if (!showCompleted) setShowArchived(false);
            }}
            className={`font-semibold py-1.5 px-3 rounded-lg text-sm flex items-center transition-colors ${showCompleted
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-background hover:bg-muted text-muted-foreground border border-border'
              }`}
          >
            Completed
          </button>
          <button
            onClick={() => {
              setShowArchived(!showArchived);
              if (!showArchived) setShowCompleted(false);
            }}
            className={`font-semibold py-1.5 px-3 rounded-lg text-sm flex items-center transition-colors ${showArchived
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'bg-background hover:bg-muted text-muted-foreground border border-border'
              }`}
          >
            Archive
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {filteredProjects.length === 0 ? (
          <div className="text-center bg-card border border-border rounded-xl p-12 mt-4 shadow-sm">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-border/50">
              <AppWindow className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-xl font-semibold text-foreground">No projects found.</p>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              {onlyMe ? 'You are not directly assigned to any active operations yet.' : 'Try adjusting your search filters or start a new project.'}
            </p>
          </div>
        ) : (
          viewMode === 'grid' ? (
            <div className="flex flex-col gap-8 pb-8">
              {sortedClients.map(clientName => (
                <div key={clientName}>
                  <div className="flex items-center gap-3 mb-4">
                     {groupedProjects[clientName][0]?.client?.logo_url && clientName !== 'Ohne Kunden' && (
                        <ClientLogo logoPath={groupedProjects[clientName][0].client?.logo_url} companyName={clientName} className="w-6 h-6 rounded-full" />
                     )}
                     <h2 className="text-xl font-bold text-foreground">{clientName}</h2>
                     <span className="text-xs font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{groupedProjects[clientName].length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {groupedProjects[clientName].map(project => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onSelectProject={onSelectProject}
                        onStatusChange={(status) => updateMutation.mutate({ id: project.id, status })}
                        financialData={financialOverview[project.id]}
                        marginData={marginsData[project.id]}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === 'table' ? (
            renderTableView()
          ) : (
            renderBoardView()
          )
        )}
      </div>

    </div>
  );
};
