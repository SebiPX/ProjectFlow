
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Project } from '../types/supabase';
import { ProjectStatus } from '../types/supabase';
import { getProjects, getProjectsFinancialOverview } from '../services/api/projects';
import { ProjectFormModal } from './ProjectFormModal';
import { useAuth } from '../lib/AuthContext';
import { calculateProjectsMargins } from '../services/api/projectFinancials';
import { ClientLogo } from './ui/ClientLogo';

interface ProjectListProps {
  onSelectProject: (project: Project) => void;
}

const statusColors: { [key in ProjectStatus]: string } = {
  [ProjectStatus.Active]: 'bg-blue-500',
  [ProjectStatus.Completed]: 'bg-green-500',
  [ProjectStatus.Planned]: 'bg-orange-500',
  [ProjectStatus.OnHold]: 'bg-yellow-500',
  [ProjectStatus.Cancelled]: 'bg-red-500',
};

const ProjectCard: React.FC<{
  project: Project;
  onSelectProject: (project: Project) => void;
  financialData?: { costs: number; billableValue: number; total: number };
  marginData?: { profit: number; marginPercentage: number; status: string };
}> = ({ project, onSelectProject, financialData, marginData }) => {
  const budget = project.budget_total || 0;
  const spent = financialData?.total || 0;
  const progress = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  // Check if deadline is overdue
  const deadline = project.deadline ? new Date(project.deadline) : null;
  const isOverdue = deadline && deadline < new Date();
  const daysUntilDeadline = deadline
    ? Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div
      onClick={() => onSelectProject(project)}
      className="bg-gray-800 border border-gray-700 rounded-lg p-5 flex flex-col justify-between hover:border-blue-500 cursor-pointer transition-all duration-200"
    >
      <div>
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-white">{project.title}</h3>
          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full text-white ${statusColors[project.status || ProjectStatus.Planned]}`}
          >
            {project.status?.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <ClientLogo
            logoPath={project.client?.logo_url}
            companyName={project.client?.company_name || 'Client'}
            className="w-5 h-5 rounded-full object-cover"
          />
          <p className="text-sm text-gray-400">{project.client?.company_name}</p>
        </div>

        {/* Deadline */}
        {deadline && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${isOverdue ? 'text-red-400' : daysUntilDeadline && daysUntilDeadline <= 7 ? 'text-yellow-400' : 'text-gray-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
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

        <p className="text-sm text-gray-400 mt-3 line-clamp-2">{project.description}</p>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-300 mb-1">
          <span>Budget Usage</span>
          <span className={progress > 100 ? 'text-red-400' : ''}>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${progress > 100 ? 'bg-red-500' : progress > 80 ? 'bg-yellow-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span className={spent > budget ? 'text-red-400' : ''}>
            €{spent.toLocaleString(undefined, { maximumFractionDigits: 0 })} spent
          </span>
          <span>€{budget.toLocaleString()} budget</span>
        </div>

        {/* Margin Badge */}
        {marginData && marginData.marginPercentage !== 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Margin</span>
              <span
                className={`text-sm font-semibold px-2 py-1 rounded ${marginData.status === 'excellent'
                  ? 'bg-green-900 bg-opacity-30 text-green-400'
                  : marginData.status === 'good'
                    ? 'bg-blue-900 bg-opacity-30 text-blue-400'
                    : marginData.status === 'acceptable'
                      ? 'bg-yellow-900 bg-opacity-30 text-yellow-400'
                      : marginData.status === 'poor'
                        ? 'bg-orange-900 bg-opacity-30 text-orange-400'
                        : 'bg-red-900 bg-opacity-30 text-red-400'
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

export const ProjectList: React.FC<({ onSelectProject: (project: Project) => void; searchQuery?: string })> = ({ onSelectProject, searchQuery = '' }) => {
  const { user, profile } = useAuth();
  const isAdminOrPJM = profile?.role === 'admin' || profile?.role === 'pjm';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [onlyMe, setOnlyMe] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const { data: financialOverview = {} } = useQuery({
    queryKey: ['projects-financial-overview'],
    queryFn: getProjectsFinancialOverview,
  });

  // Fetch margin data for all projects
  const { data: marginsData = {} } = useQuery({
    queryKey: ['projects-margins', projects.map(p => p.id)],
    queryFn: () => calculateProjectsMargins(projects.map(p => p.id)),
    enabled: projects.length > 0,
  });

  // Filter projects based on "Only Me" toggle AND Search Query
  const filteredProjects = projects.filter(project => {
    // 0. Archived Filter
    if (showArchived && !project.is_archived) return false;
    if (!showArchived && project.is_archived) return false;

    // 1. Only Me Filter
    if (onlyMe) {
      const isTeamMember = project.project_members?.some(member => member.profile_id === user?.id);
      if (!isTeamMember) return false;
    }

    // 2. Search Query Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = project.title?.toLowerCase().includes(query);
      const matchesClient = project.client?.company_name?.toLowerCase().includes(query);
      const matchesDesc = project.description?.toLowerCase().includes(query);
      return matchesTitle || matchesClient || matchesDesc;
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500 text-xl">Error loading projects. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-sm text-gray-400 mt-1">
            {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
            {onlyMe && ' • Only Me'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setOnlyMe(!onlyMe)}
            className={`font-semibold py-2 px-4 rounded-lg flex items-center transition-colors ${onlyMe
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Only Me
          </button>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`font-semibold py-2 px-4 rounded-lg flex items-center transition-colors ${showArchived
              ? 'bg-orange-600 hover:bg-orange-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Show Archive
          </button>
          {isAdminOrPJM && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Project
            </button>
          )}
        </div>
      </div>
      {filteredProjects.length === 0 ? (
        <div className="text-center text-gray-400 mt-12">
          <p className="text-xl">No projects found.</p>
          <p className="mt-2">
            {onlyMe ? 'You are not assigned to any projects yet.' : 'Create your first project to get started!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelectProject={onSelectProject}
              financialData={financialOverview[project.id]}
              marginData={marginsData[project.id]}
            />
          ))}
        </div>
      )}

      <ProjectFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
