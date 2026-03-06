
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
import { getTasksByProject } from '../services/api/tasks';
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

interface ProjectDetailProps {
  project: Project;
}

type ProjectTab = 'overview' | 'tasks' | 'finances' | 'assets' | 'team' | 'services';

const tabs: { id: ProjectTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'finances', label: 'Finances' },
  { id: 'assets', label: 'Assets' },
  { id: 'team', label: 'Team' },
  { id: 'services', label: 'Services' },
];

import { AssetCard } from './AssetCard';

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project: initialProject }) => {
  const queryClient = useQueryClient();
  const { profile } = useAuth(); // Add this hook call
  const isClient = profile?.role === 'client';

  const visibleTabs = tabs.filter(tab => {
    if (isClient) {
      return ['overview', 'tasks', 'finances', 'assets'].includes(tab.id);
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
  const [activeTab, setActiveTab] = useState<ProjectTab>('tasks');
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

  const handleDeleteAsset = (assetId: string, assetName: string) => {
    if (confirm(`Are you sure you want to delete "${assetName}"?`)) {
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
          return <div className="p-6 text-gray-300">Loading tasks...</div>;
        }
        return (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Project Tasks</h2>
              <button
                onClick={() => setIsTaskFormModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Icon path="M12 4v16m8-8H4" className="w-5 h-5" />
                Create Task
              </button>
            </div>
            <div className="flex-grow overflow-hidden">
              <KanbanBoard tasks={tasks} />
            </div>
          </div>
        );
      case 'assets':
        if (assetsLoading) {
          return <div className="p-6 text-gray-300">Loading assets...</div>;
        }

        // Filter assets for clients (handled in KanbanBoard too, but useful for empty check if we want)
        // Actually, KanbanBoard handles filtering columns. We pass all assets to it, or filtered assets?
        // Better to pass all assets and let KanbanBoard hide columns, OR filter assets passed to it.
        // If we filter assets here, we must ensure drag/drop logic works.
        // Let's pass ALL assets to KanbanBoard, but if isClient, KanbanBoard only shows relevant columns.
        // However, we should filter assets so clients don't get data for hidden assets in the props (safety).
        const displayedAssets = isClient
          ? assets.filter(asset => asset.status === 'client_review' || asset.status === 'approved')
          : assets;

        return (
          <div className="flex flex-col h-full bg-gray-900/50">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Project Assets</h2>
              {!isClient && (
                <button
                  onClick={() => setIsAssetUploadModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
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
              />
            </div>
          </div>
        );
      case 'finances':
        if (costsLoading) {
          return <div className="p-6 text-gray-300">Loading finance data...</div>;
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
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-gray-400 text-sm mb-1">Total Budget</h3>
                    <p className="text-2xl font-bold text-white">€{budget.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-gray-400 text-sm mb-1">Direct Costs</h3>
                    <p className="text-2xl font-bold text-orange-400">€{totalCosts.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{costs.length} items</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-gray-400 text-sm mb-1">Billable Hours Value</h3>
                    <p className="text-2xl font-bold text-blue-400">€{billableValue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{billableData?.billableHours?.toFixed(1) || 0}h tracked</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-gray-400 text-sm mb-1">Remaining Budget</h3>
                    <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      €{remaining.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {budget > 0 ? `${Math.round((totalSpent / budget) * 100)}% used` : 'No budget set'}
                    </p>
                  </div>
                </div>

                {/* Costs List */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                      <h2 className="text-xl font-bold text-white">Direct Costs</h2>
                      <select
                        value={costCategoryFilter}
                        onChange={(e) => setCostCategoryFilter(e.target.value)}
                        className="px-3 py-1.5 bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500"
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
                    <button
                      onClick={() => setIsCostFormModalOpen(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Icon path="M12 4v16m8-8H4" className="w-5 h-5" />
                      Add Cost
                    </button>
                  </div>

                  {filteredCosts.length === 0 ? (
                    <div className="text-center text-gray-400 py-12 bg-gray-800 rounded-lg border border-gray-700">
                      <Icon path="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                      <p className="text-lg font-semibold mb-1">No costs recorded yet</p>
                      <p className="text-sm">Add your first project cost to start tracking expenses</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredCosts.map((cost) => (
                        <div
                          key={cost.id}
                          className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-white font-semibold">{cost.title}</h3>
                                {cost.category && (
                                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                                    {cost.category}
                                  </span>
                                )}
                                {cost.is_estimated && (
                                  <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
                                    Estimated
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="text-lg font-bold text-white">€{cost.amount.toLocaleString()}</span>
                                {cost.created_at && (
                                  <span>Added {new Date(cost.created_at).toLocaleDateString('de-DE')}</span>
                                )}
                                {cost.invoice_document_path && (
                                  <button
                                    onClick={() => handleDownloadCostDocument(cost.invoice_document_path!)}
                                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                                  >
                                    <Icon path="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" className="w-4 h-4" />
                                    Document
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingCost(cost)}
                                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
                                title="Edit cost"
                              >
                                <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCost(cost.id, cost.title)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                                title="Delete cost"
                              >
                                <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-5 h-5" />
                              </button>
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
              <div className={`flex justify-between items-center mb-4 ${!isClient ? 'border-t border-gray-700 pt-6' : ''}`}>
                <h2 className="text-xl font-bold text-white">Quotes & Invoices</h2>
                {!isClient && (
                  <button
                    onClick={handleCreateDocument}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Icon path="M12 4v16m8-8H4" className="w-5 h-5" />
                    Create Document
                  </button>
                )}
              </div>

              {financialDocuments.length === 0 ? (
                <div className="text-center text-gray-400 py-8 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-lg font-semibold mb-1">No documents yet</p>
                  <p className="text-sm">Create a Quote or Invoice to get started</p>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
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
                        <tr key={doc.id} className="hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {new Date(doc.date_issued!).toLocaleDateString('de-DE')}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-white">
                            {doc.document_number || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${doc.type === DocType.Quote ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'
                              }`}>
                              {doc.type === DocType.Quote ? 'Quote' : 'Invoice'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${doc.status === DocStatus.Draft ? 'bg-gray-600/20 text-gray-400' :
                              doc.status === DocStatus.Sent ? 'bg-blue-500/20 text-blue-400' :
                                doc.status === DocStatus.Approved ? 'bg-green-500/20 text-green-400' :
                                  doc.status === DocStatus.Paid ? 'bg-emerald-500/20 text-emerald-400' :
                                    'bg-red-500/20 text-red-400'
                              }`}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-white text-right font-mono">
                            {doc.total_net?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => generateInvoicePDF(doc, doc.items, project.client)}
                                className="text-gray-400 hover:text-white p-1 hover:bg-gray-600 rounded"
                                title="Download PDF"
                              >
                                <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditDocument(doc)}
                                className="text-blue-400 hover:text-blue-300 p-1 hover:bg-gray-600 rounded"
                                title="Edit"
                              >
                                <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDocument(doc.id, doc.document_number || '')}
                                className="text-red-400 hover:text-red-300 p-1 hover:bg-gray-600 rounded"
                                title="Delete"
                              >
                                <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-4 h-4" />
                              </button>
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
          return <div className="p-6 text-gray-300">Loading team members...</div>;
        }
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Project Team</h2>
              {!isClient && (
                <button
                  onClick={() => setIsAddTeamMemberModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Icon path="M12 4v16m8-8H4" className="w-5 h-5" />
                  Add Team Member
                </button>
              )}
            </div>
            {teamMembers.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-lg font-semibold mb-2">No team members yet</p>
                <p className="text-sm">Add your first team member to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamMembers.map((member) => (
                  <div
                    key={`member-${member.project_id}-${member.profile_id}-${Math.random()}`}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          avatarPath={member.profile?.avatar_url}
                          alt={member.profile?.full_name || 'User'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="text-white font-semibold">
                            {member.profile?.full_name || member.profile?.email || 'Unknown'}
                          </h3>
                          <p className="text-xs text-gray-400 capitalize">
                            {member.profile?.role?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleRemoveTeamMember(
                            member.profile_id,
                            member.profile?.full_name || 'team member'
                          )
                        }
                        className="text-red-400 hover:text-red-300 p-1 hover:bg-gray-700 rounded transition-colors"
                        title="Remove from project"
                      >
                        <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
                      </button>
                    </div>
                    {member.role && (
                      <div className="mt-2 pt-2 border-t border-gray-700">
                        <p className="text-xs text-gray-500">Project Role:</p>
                        <p className="text-sm text-blue-400 font-medium">{member.role}</p>
                      </div>
                    )}
                    {member.profile?.email && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
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
      default:
        return <div className="p-6 text-gray-300">{project.description}</div>;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-8 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-400">Project #{project.project_number}</p>
            <h1 className="text-3xl font-bold text-white">{project.title}</h1>
            <p className="text-md text-blue-400 mt-1">{project.client?.company_name}</p>
          </div>
          <div>
            {!isClient && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-4 h-4" />
                Edit Project
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="border-b border-gray-800">
        <nav className="flex space-x-8 px-8" aria-label="Tabs">
          {visibleTabs.map((tab) => (
            <button
              key={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`
                    ${tab.id === activeTab ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-grow overflow-y-auto">
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
