
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/AuthContext';
import { getProjects } from '../services/api/projects';
import { getFinancialDocuments } from '../services/api/financialDocuments';
import { getAssetsByProject } from '../services/api/assets';
import { Icon } from './ui/Icon';
import { Project, ProjectStatus, DocStatus, AssetStatus, DocType } from '../types/supabase';
import type { FinancialDocument, Asset } from '../types/supabase';

interface ClientDashboardProps {
    onSelectProject: (project: Project) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ onSelectProject }) => {
    const { profile } = useAuth();

    // 1. Fetch Projects (RLS will filter to only this client's projects)
    const { data: projects = [], isLoading: projectsLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: getProjects,
    });

    // 2. Aggregate Pending Items (Assets & Documents)
    // Since we don't have a "get all my assets/docs" API yet, we'll map over projects
    // In a real app with many projects, we'd want a dedicated RPC or API endpoint.
    // For now, client project count is likely low, so we can fetch per project.

    const activeProjects = projects.filter(p => p.status === ProjectStatus.Active);

    // Calculate total budget (sum of projects) - Optional, maybe nice for client to see total spend?
    // Let's stick to "Pending Approvals" as the main call to action.

    return (
        <div className="p-8 space-y-8">
            {/* Welcome Section */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Welcome back, {profile?.full_name?.split(' ')[0] || 'Client'}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Here's what's happening with your projects today.
                    </p>
                </div>
                <div className="bg-card p-4 rounded-lg border border-border flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full text-primary-foreground">
                        <Icon path="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Active Projects</p>
                        <p className="text-2xl font-bold text-foreground">{activeProjects.length}</p>
                    </div>
                </div>
            </div>

            {/* Projects Grid */}
            <div>
                <h2 className="text-xl font-bold text-foreground mb-4">Your Active Projects</h2>
                {projectsLoading ? (
                    <div className="text-muted-foreground">Loading projects...</div>
                ) : activeProjects.length === 0 ? (
                    <div className="bg-card rounded-lg p-8 text-center border border-border">
                        <p className="text-muted-foreground">No active projects found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeProjects.map(project => (
                            <div
                                key={project.id}
                                onClick={() => onSelectProject(project)}
                                className="bg-card rounded-lg border border-border p-6 hover:bg-gray-750 transition-colors cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors text-primary-foreground">
                                        <Icon path="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" className="w-6 h-6 text-primary" />
                                    </div>
                                    {project.deadline && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1 bg-background px-2 py-1 rounded">
                                            <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2h-1m-4-6l-4 4m0 0l-4-4m4 4V4" className="w-3 h-3" />
                                            Due {new Date(project.deadline).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                                    {project.title}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                    {project.description || 'No description available'}
                                </p>

                                <div className="flex items-center text-sm text-primary font-medium pt-4 border-t border-border">
                                    View Project Details
                                    <Icon path="M9 5l7 7-7 7" className="w-4 h-4 ml-1" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pending Actions (Placeholder for now) */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                    <div className="bg-yellow-500/10 p-3 rounded-full">
                        <Icon path="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Approvals & Actions</h2>
                        <p className="text-sm text-muted-foreground">Items requiring your attention will appear here.</p>
                    </div>
                </div>
                {/* We can expand this later to show assets with status='client_review' or invoices with status='sent' */}
            </div>

        </div>
    );
};
