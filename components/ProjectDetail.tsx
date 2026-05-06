
import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import type { Project } from '../types/supabase';
import { KanbanBoard } from './KanbanBoard';
import { ProjectEditModal } from './ProjectEditModal';
import { AssetUploadModal } from './AssetUploadModal';
import { AssetPreviewModal } from './AssetPreviewModal';
import { AssetStatusModal } from './AssetStatusModal';
import { AddTeamMemberModal } from './AddTeamMemberModal';
import { CostFormModal } from './CostFormModal';
import { CostEditModal } from './CostEditModal';
import { TaskFormModal } from './TaskFormModal';
import { AssetKanbanBoard } from './AssetKanbanBoard';
import { getTasksByProject, updateTaskStatus, deleteTask } from '../services/api/tasks';
import { getAssetsByProject, downloadAsset, deleteAsset, getAssetSignedUrl, updateAsset } from '../services/api/assets';
import { getProjectMembers, removeProjectMember } from '../services/api/projectMembers';
import { getCostsByProject, deleteCost, getCostDocumentSignedUrl } from '../services/api/costs';
import { getProjectById } from '../services/api/projects';
import { calculateProjectBillableValue } from '../services/api/timeEntries';
import type { Cost } from '../types/supabase';
import { Icon } from './ui/Icon';
import { ProjectMarginCard } from './ProjectMarginCard';
import { ProjectServiceBreakdown } from './ProjectServiceBreakdown';
import { FileIcon } from './ui/FileIcon';
import { Avatar } from './ui/Avatar';
import type { Asset } from '../types/supabase';
import { FinancialDocumentFormModal } from './FinancialDocumentFormModal';
import { generateInvoicePDF } from '../services/pdfGenerator';
import { getFinancialDocuments, deleteFinancialDocument } from '../services/api/financialDocuments';
import { FinancialDocument, FinancialItem, DocType, DocStatus } from '../types/supabase';
import { DocumentList } from './documents/DocumentList';
import { CasesList } from './CasesList';

interface ProjectDetailProps {
  project: Project;
  defaultTab?: string;
}

type ProjectTab = 'overview' | 'tasks' | 'finances' | 'assets' | 'team' | 'services' | 'documents' | 'cases';

const tabs: { id: ProjectTab; label: string }[] = [
  { id: 'overview', label: 'Briefing' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'finances', label: 'Finances' },
  { id: 'assets', label: 'Assets' },
  { id: 'team', label: 'Team' },
  { id: 'services', label: 'Services' },
  { id: 'documents', label: 'Documents' },
  { id: 'cases', label: 'Cases' },
];

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project: initialProject, defaultTab }) => {
  const queryClient = useQueryClient();
  const { profile } = useAuth(); // Add this hook call
  const isClient = profile?.role === 'client';
  const isAdminOrPJM = profile?.role === 'admin' || profile?.role === 'pjm';

  const isFreelancer = profile?.role === 'freelancer';

  const visibleTabs = tabs.filter(tab => {
    if (isClient) {
      return ['overview', 'tasks', 'assets'].includes(tab.id);
    }
    if (isFreelancer) {
      return ['overview', 'tasks', 'assets', 'team', 'services', 'cases'].includes(tab.id); // hide finances, documents
    }
    return true;
  });

  // Real-time project data
  const { data: project = initialProject } = useQuery({
    queryKey: ['projects', initialProject.id],
    queryFn: async () => {
      const data = await getProjectById(initialProject.id);
      return data || initialProject;
    },
    initialData: initialProject,
  });
  const [activeTab, setActiveTab] = useState<ProjectTab>((defaultTab as ProjectTab) || 'tasks');

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab as ProjectTab);
    }
  }, [defaultTab]);
  const [isTaskFormModalOpen, setIsTaskFormModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssetUploadModalOpen, setIsAssetUploadModalOpen] = useState(false);
  const [isAddTeamMemberModalOpen, setIsAddTeamMemberModalOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [statusModalAsset, setStatusModalAsset] = useState<Asset | null>(null);
  const [isCostFormModalOpen, setIsCostFormModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<Cost | null>(null);
  const [costCategoryFilter, setCostCategoryFilter] = useState<string>('all');

  // Financial Documents State
  const [isFinancialDocModalOpen, setIsFinancialDocModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<(FinancialDocument & { items: FinancialItem[] }) | undefined>(undefined);

  // Fetch real tasks for this project
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', project.id],
    queryFn: () => getTasksByProject(project.id),
  });

  // Fetch real assets for this project
  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ['assets', project.id],
    queryFn: () => getAssetsByProject(project.id),
  });

  // Fetch team members for this project
  const { data: teamMembers = [], isLoading: teamLoading } = useQuery({
    queryKey: ['project-members', project.id],
    queryFn: () => getProjectMembers(project.id),
  });

  // Fetch costs for this project
  const { data: costs = [], isLoading: costsLoading } = useQuery({
    queryKey: ['costs', project.id],
    queryFn: () => getCostsByProject(project.id),
  });

  // Fetch billable value
  const { data: billableData } = useQuery({
    queryKey: ['billable-value', project.id],
    queryFn: () => calculateProjectBillableValue(project.id),
  });

  // Fetch Financial Documents
  const { data: financialDocuments = [], isLoading: docsLoading } = useQuery({
    queryKey: ['financial-documents', project.id],
    queryFn: () => getFinancialDocuments(project.id),
  });

  // Asset Status Update Mutation
  const updateAssetStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) =>
      updateAsset(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', project.id] });
      toast.success('Asset status updated');
    },
    onError: (error: any) => {
      toast.error(`Failed to update asset status: ${error.message}`);
    }
  });

  const handleUpdateAssetStatus = (assetId: string, newStatus: any) => {
    updateAssetStatusMutation.mutate({ id: assetId, status: newStatus });
  };

  // Asset Rename Mutation
  const renameAssetMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateAsset(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', project.id] });
      toast.success('Asset renamed successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to rename asset: ${error.message}`);
    }
  });

  const handleRenameAsset = (assetId: string, newName: string) => {
    renameAssetMutation.mutate({ id: assetId, name: newName });
  };

  // Task Status Update Mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) =>
      updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', project.id] });
      toast.success('Task status updated');
    },
    onError: (error: any) => {
      toast.error(`Failed to update task status: ${error.message}`);
    }
  });

  const handleUpdateTaskStatus = (taskId: string, newStatus: any) => {
    updateTaskStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', project.id] });
      toast.success('Task successfully deleted');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });

  const handleDeleteTask = (task: Task) => {
    deleteTaskMutation.mutate(task.id);
  };

  // Delete asset mutation
  const deleteAssetMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', project.id] });
      toast.success('Asset deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete asset: ${error.message}`);
    },
  });

  const handleDownloadAsset = async (storagePath: string, name: string) => {
    try {
      await downloadAsset(storagePath, name);
      toast.success('Download started!');
    } catch (error: any) {
      toast.error(`Failed to download: ${error.message}`);
    }
  };

  const handleDeleteAsset = (assetId: string, assetName?: string) => {
    if (confirm(`Are you sure you want to delete ${assetName ? `"${assetName}"` : "this asset"}?`)) {
      deleteAssetMutation.mutate(assetId);
    }
  };

  // Remove team member mutation
  const removeTeamMemberMutation = useMutation({
    mutationFn: ({ profileId }: { profileId: string }) =>
      removeProjectMember(project.id, profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', project.id] });
      toast.success('Team member removed successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to remove team member: ${error.message}`);
    },
  });

  // Delete cost mutation
  const deleteCostMutation = useMutation({
    mutationFn: deleteCost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs', project.id] });
      queryClient.invalidateQueries({ queryKey: ['billable-value', project.id] });
      toast.success('Cost deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete cost: ${error.message}`);
    },
  });

  const handleRemoveTeamMember = (profileId: string, memberName: string) => {
    if (confirm(`Are you sure you want to remove "${memberName}" from this project?`)) {
      removeTeamMemberMutation.mutate({ profileId });
    }
  };

  const handleDeleteCost = (costId: string, costTitle: string) => {
    if (confirm(`Are you sure you want to delete "${costTitle}"?`)) {
      deleteCostMutation.mutate(costId);
    }
  };

  const handleDownloadCostDocument = async (documentPath: string) => {
    try {
      const url = await getCostDocumentSignedUrl(documentPath);
      window.open(url, '_blank');
      toast.success('Opening document...');
    } catch (error: any) {
      toast.error(`Failed to open document: ${error.message}`);
    }
  };

  const deleteDocumentMutation = useMutation({
    mutationFn: deleteFinancialDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-documents', project.id] });
      queryClient.invalidateQueries({ queryKey: ['projects', project.id] });
      toast.success('Document deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });

  const handleDeleteDocument = (docId: string, docNumber: string) => {
    if (confirm(`Are you sure you want to delete document "${docNumber || 'Untitled'}"?`)) {
      deleteDocumentMutation.mutate(docId);
    }
  };

  const handleEditDocument = (doc: FinancialDocument & { items: FinancialItem[] }) => {
    setEditingDocument(doc);
    setIsFinancialDocModalOpen(true);
  };

  const handleCreateDocument = () => {
    setEditingDocument(undefined);
    setIsFinancialDocModalOpen(true);
  };

  const renderContent = (tab: ProjectTab) => {
    switch (tab) {
      case 'tasks':
        if (tasksLoading) {
          return <div className="p-6 text-muted-foreground">Loading tasks...</div>;
        }
        return (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">Project Tasks</h2>
              {true && (
                <button
                  onClick={() => setIsTaskFormModalOpen(true)}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors flex items-center gap-2"
                >
                  <Icon path="M12 4v16m8-8H4" className="w-5 h-5" />
                  Create Task
                </button>
              )}
            </div>
            <div className="flex-grow overflow-hidden">
              <KanbanBoard tasks={tasks} onStatusChange={handleUpdateTaskStatus} onDeleteTask={handleDeleteTask} />
            </div>
          </div>
        );
      case 'assets':
        if (assetsLoading) {
          return <div className="p-6 text-muted-foreground">Loading assets...</div>;
        }

        // Filter assets for clients (handled in KanbanBoard too, but useful for empty check if we want)
        // Also filter out internal project files from the assets tab
        const displayedAssets = isClient
          ? assets.filter(asset => (asset.status === 'client_review' || asset.status === 'approved') && !asset.description?.includes('[SYSTEM:PROJECT_FILE]'))
          : assets.filter(asset => !asset.description?.includes('[SYSTEM:PROJECT_FILE]'));

        return (
          <div className="flex flex-col h-full bg-background/50">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">Project Assets</h2>
              {!isClient && (
                <button
                  onClick={() => setIsAssetUploadModalOpen(true)}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors flex items-center gap-2"
                >
                  <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" className="w-5 h-5" />
                  Upload Asset
                </button>
              )}
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
              <AssetKanbanBoard
                assets={displayedAssets}
                onStatusChange={handleUpdateAssetStatus}
                onDownload={handleDownloadAsset}
                onDelete={handleDeleteAsset}
                onPreview={(asset) => setPreviewAsset(asset)}
                onChangeStatus={setStatusModalAsset}
                onRename={handleRenameAsset}
              />
            </div>
          </div>
        );
      case 'finances':
        if (costsLoading) {
          return <div className="p-6 text-muted-foreground">Loading finance data...</div>;
        }

        const budget = project.budget_total || 0;
        const totalCosts = costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);
        const billableValue = billableData?.totalValue || 0;
        const totalSpent = totalCosts + billableValue;
        const remaining = budget - totalSpent;
        const filteredCosts = costCategoryFilter === 'all'
          ? costs
          : costs.filter(c => c.category === costCategoryFilter);

        return (
          <div className="p-6 space-y-6">
            {!isClient && (
              <>
                {/* Project Margin Card */}
                <ProjectMarginCard projectId={project.id} />

                {/* Budget Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <h3 className="text-muted-foreground text-sm mb-1">Total Budget</h3>
                    <p className="text-2xl font-bold text-foreground">€{budget.toLocaleString()}</p>
                  </div>
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <h3 className="text-muted-foreground text-sm mb-1">Direct Costs</h3>
                    <p className="text-2xl font-bold text-orange-400">€{totalCosts.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{costs.length} items</p>
                  </div>
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <h3 className="text-muted-foreground text-sm mb-1">Billable Hours Value</h3>
                    <p className="text-2xl font-bold text-primary">€{billableValue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{billableData?.billableHours?.toFixed(1) || 0}h tracked</p>
                  </div>
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <h3 className="text-muted-foreground text-sm mb-1">Remaining Budget</h3>
                    <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      €{remaining.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {budget > 0 ? `${Math.round((totalSpent / budget) * 100)}% used` : 'No budget set'}
                    </p>
                  </div>
                </div>

                {/* Costs List */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                      <h2 className="text-xl font-bold text-foreground">Direct Costs</h2>
                      <select
                        value={costCategoryFilter}
                        onChange={(e) => setCostCategoryFilter(e.target.value)}
                        className="px-3 py-1.5 bg-muted border border-input text-foreground text-sm rounded-lg focus:ring-primary focus:border-primary"
                      >
                        <option value="all">All Categories</option>
                        <option value="Software/Licenses">Software/Licenses</option>
                        <option value="External Services">External Services</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Hardware">Hardware</option>
                        <option value="Travel">Travel</option>
                        <option value="Office Supplies">Office Supplies</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    {isAdminOrPJM && (
                      <button
                        onClick={() => setIsCostFormModalOpen(true)}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Icon path="M12 4v16m8-8H4" className="w-5 h-5" />
                        Add Cost
                      </button>
                    )}
                  </div>

                  {filteredCosts.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12 bg-card rounded-lg border border-border">
                      <Icon path="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                      <p className="text-lg font-semibold mb-1">No costs recorded yet</p>
                      <p className="text-sm">Add your first project cost to start tracking expenses</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredCosts.map((cost) => (
                        <div
                          key={cost.id}
                          className="bg-card border border-border rounded-lg p-4 hover:border-input transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-foreground font-semibold">{cost.title}</h3>
                                {cost.category && (
                                  <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
                                    {cost.category}
                                  </span>
                                )}
                                {cost.is_estimated && (
                                  <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
                                    Estimated
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="text-lg font-bold text-foreground">€{cost.amount.toLocaleString()}</span>
                                {cost.created_at && (
                                  <span>Added {new Date(cost.created_at).toLocaleDateString('de-DE')}</span>
                                )}
                                {cost.invoice_document_path && (
                                  <button
                                    onClick={() => handleDownloadCostDocument(cost.invoice_document_path!)}
                                    className="flex items-center gap-1 text-primary hover:text-blue-300"
                                  >
                                    <Icon path="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" className="w-4 h-4" />
                                    Document
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isAdminOrPJM && (
                                <>
                                  <button
                                    onClick={() => setEditingCost(cost)}
                                    className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                                    title="Edit cost"
                                  >
                                    <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCost(cost.id, cost.title)}
                                    className="p-2 text-muted-foreground hover:text-red-400 hover:bg-muted rounded-lg transition-colors"
                                    title="Delete cost"
                                  >
                                    <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Financial Documents Section */}
            <div>
              <div className={`flex justify-between items-center mb-4 ${!isClient ? 'border-t border-border pt-6' : ''}`}>
                <h2 className="text-xl font-bold text-foreground">Quotes & Invoices</h2>
                {isAdminOrPJM && (
                  <button
                    onClick={handleCreateDocument}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Icon path="M12 4v16m8-8H4" className="w-5 h-5" />
                    Create Document
                  </button>
                )}
              </div>

              {financialDocuments.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 bg-card rounded-lg border border-border">
                  <p className="text-lg font-semibold mb-1">No documents yet</p>
                  <p className="text-sm">Create a Quote or Invoice to get started</p>
                </div>
              ) : (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-background/50 text-muted-foreground text-xs uppercase">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Number</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Amount (Net)</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {financialDocuments.map((doc) => (
                        <tr key={doc.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(doc.date_issued!).toLocaleDateString('de-DE')}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-foreground">
                            {doc.document_number || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${doc.type === DocType.Quote ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'
                              }`}>
                              {doc.type === DocType.Quote ? 'Quote' : 'Invoice'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${doc.status === DocStatus.Draft ? 'bg-muted/80/20 text-primary-foreground' :
                              doc.status === DocStatus.Sent ? 'bg-primary/20 text-primary' :
                                doc.status === DocStatus.Approved ? 'bg-green-500/20 text-green-400' :
                                  doc.status === DocStatus.Paid ? 'bg-emerald-500/20 text-emerald-400' :
                                    'bg-red-500/20 text-red-400'
                              }`}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground text-right font-mono">
                            {doc.total_net?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => generateInvoicePDF(doc, doc.items, project.client)}
                                className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted/80 rounded"
                                title="Download PDF"
                              >
                                <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-4 h-4" />
                              </button>
                              {isAdminOrPJM && (
                                <>
                                  <button
                                    onClick={() => handleEditDocument(doc)}
                                    className="text-primary hover:text-blue-300 p-1 hover:bg-muted/80 rounded"
                                    title="Edit"
                                  >
                                    <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDocument(doc.id, doc.document_number || '')}
                                    className="text-red-400 hover:text-red-300 p-1 hover:bg-muted/80 rounded"
                                    title="Delete"
                                  >
                                    <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      case 'team':
        if (teamLoading) {
          return <div className="p-6 text-muted-foreground">Loading team members...</div>;
        }
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Project Team</h2>
              {isAdminOrPJM && (
                <button
                  onClick={() => setIsAddTeamMemberModalOpen(true)}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors flex items-center gap-2"
                >
                  <Icon path="M12 4v16m8-8H4" className="w-5 h-5" />
                  Add Team Member
                </button>
              )}
            </div>
            {teamMembers.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-lg font-semibold mb-2">No team members yet</p>
                <p className="text-sm">Add your first team member to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamMembers.map((member) => (
                  <div
                    key={`member-${member.project_id}-${member.user_id || member.profile_id}-${Math.random()}`}
                    className="bg-card rounded-lg p-4 border border-border hover:border-input transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          avatarPath={member.profile?.avatar_url}
                          alt={member.profile?.full_name || 'User'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="text-foreground font-semibold">
                            {member.profile?.full_name || member.profile?.email || 'Unknown'}
                          </h3>
                          <p className="text-xs text-muted-foreground capitalize">
                            {member.profile?.role?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      {isAdminOrPJM && (
                        <button
                          onClick={() =>
                            handleRemoveTeamMember(
                              member.user_id || member.profile_id || '',
                              member.profile?.full_name || 'team member'
                            )
                          }
                          className="text-red-400 hover:text-red-300 p-1 hover:bg-muted rounded transition-colors"
                          title="Remove from project"
                        >
                          <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {member.role && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">Project Role:</p>
                        <p className="text-sm text-primary font-medium">{member.role}</p>
                      </div>
                    )}
                    {member.profile?.email && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Icon path="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" className="w-3 h-3" />
                        <span className="truncate">{member.profile.email}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'services':
        return (
          <div className="space-y-4">
            <ProjectServiceBreakdown projectId={project.id} />
          </div>
        );
      case 'cases':
        return (
          <div className="h-full bg-background/50">
            <CasesList projectId={project.id} />
          </div>
        );
      case 'documents': {
        const pjm = teamMembers.find((m: any) => m.role?.toLowerCase().includes('pjm') || m.role?.toLowerCase().includes('projektleitung'));
        const pjmEmail = pjm?.profile?.email || 'hello@pixelschickeria.de';
        return <DocumentList projectId={project.id} projectTitle={project.title} pjmEmail={pjmEmail} isClient={isClient} isAdminOrPJM={isAdminOrPJM} />;
      }
      case 'overview':
      default:
        return (
          <div className="p-6 h-full bg-background/50 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
              <div className="bg-card p-4 rounded-lg border border-border shadow-sm flex items-center gap-3">
                <div className="p-2 bg-primary/20 text-primary rounded-lg">
                  <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Start Date</p>
                  <p className="text-sm font-medium text-foreground">
                    {project.start_date ? new Date(project.start_date).toLocaleDateString('de-DE') : 'Not set'}
                  </p>
                </div>
              </div>
              <div className="bg-card p-4 rounded-lg border border-border shadow-sm flex items-center gap-3">
                <div className="p-2 bg-red-500/20 text-red-400 rounded-lg">
                  <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Due Date</p>
                  <p className="text-sm font-medium text-foreground">
                    {project.deadline ? new Date(project.deadline).toLocaleDateString('de-DE') : 'Not set'}
                  </p>
                </div>
              </div>
              <div className="bg-card p-4 rounded-lg border border-border shadow-sm flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                  <Icon path="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Category</p>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {project.category ? project.category.replace(/_/g, ' ') : 'Not set'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 md:p-8 rounded-lg border border-border shadow-sm max-w-4xl">
              <h2 className="text-xl font-bold text-foreground mb-6">Briefing</h2>
              <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90 font-sans">
                {project.description || <span className="text-muted-foreground italic">No briefing description provided for this project.</span>}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col print:h-auto print:block">
      <div className="p-8 border-b border-border print:hidden">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Project #{project.project_number}</p>
            <h1 className="text-3xl font-bold text-foreground">{project.title}</h1>
            <p className="text-md text-primary mt-1">{project.client?.company_name}</p>
          </div>
          <div>
            {isAdminOrPJM && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors flex items-center gap-2"
              >
                <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-4 h-4" />
                Edit Project
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="border-b border-border print:hidden">
        <nav className="flex space-x-8 px-8" aria-label="Tabs">
          {visibleTabs.map((tab) => (
            <button
              key={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`
                    ${tab.id === activeTab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-500'}
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-grow overflow-y-auto print:overflow-visible print:h-auto print:block">
        {renderContent(activeTab)}
      </div>

      <ProjectEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        project={project}
      />

      <AssetUploadModal
        isOpen={isAssetUploadModalOpen}
        onClose={() => setIsAssetUploadModalOpen(false)}
        projectId={project.id}
      />

      <AssetPreviewModal
        isOpen={!!previewAsset}
        onClose={() => setPreviewAsset(null)}
        asset={previewAsset}
        onDownload={previewAsset?.storage_path ? () => handleDownloadAsset(previewAsset.storage_path!, previewAsset.name) : undefined}
      />

      <AddTeamMemberModal
        isOpen={isAddTeamMemberModalOpen}
        onClose={() => setIsAddTeamMemberModalOpen(false)}
        projectId={project.id}
      />

      <AssetStatusModal
        isOpen={!!statusModalAsset}
        onClose={() => setStatusModalAsset(null)}
        asset={statusModalAsset}
      />

      <CostFormModal
        isOpen={isCostFormModalOpen}
        onClose={() => setIsCostFormModalOpen(false)}
        projectId={project.id}
      />

      {editingCost && (
        <CostEditModal
          isOpen={!!editingCost}
          onClose={() => setEditingCost(null)}
          cost={editingCost}
          projectId={project.id}
        />
      )}

      {isFinancialDocModalOpen && (
        <FinancialDocumentFormModal
          isOpen={isFinancialDocModalOpen}
          onClose={() => setIsFinancialDocModalOpen(false)}
          projectId={project.id}
          document={editingDocument}
        />
      )}

      <TaskFormModal
        isOpen={isTaskFormModalOpen}
        onClose={() => setIsTaskFormModalOpen(false)}
        preSelectedProjectId={project.id}
      />
    </div>
  );
};
