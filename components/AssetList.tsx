
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import type { Project, Asset } from '../types/supabase';
import { AssetStatus, AssetType } from '../types/supabase';
import { getAssets, downloadAsset, deleteAsset } from '../services/api/assets';
import { getProjects } from '../services/api/projects';
import { useAuth } from '../lib/AuthContext';
import { AssetUploadModal } from './AssetUploadModal';
import { AssetPreviewModal } from './AssetPreviewModal';
import { AssetStatusModal } from './AssetStatusModal';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { FileIcon } from './ui/FileIcon';
import { Avatar } from './ui/Avatar';

interface AssetListProps {
  onSelectProject: (project: Project) => void;
}

interface AssetFilters {
  status: AssetStatus | 'all';
  projectId: string | 'all';
  category: AssetType | 'all';
  uploaderId: string | 'all';
}

interface AssetSort {
  field: 'name' | 'created_at' | 'status' | 'category';
  direction: 'asc' | 'desc';
}

const assetStatusStyles: { [key in AssetStatus]: string } = {
  [AssetStatus.Upload]: 'bg-gray-500/20 text-muted-foreground',
  [AssetStatus.InternalReview]: 'bg-yellow-500/20 text-yellow-400',
  [AssetStatus.ClientReview]: 'bg-purple-500/20 text-purple-400',
  [AssetStatus.ChangesRequested]: 'bg-red-500/20 text-red-400',
  [AssetStatus.Approved]: 'bg-green-500/20 text-green-400',
  [AssetStatus.Archived]: 'bg-muted/20 text-muted-foreground',
};

// Helper function for file size formatting
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// AssetCard Component
const AssetCard: React.FC<{
  asset: Asset;
  project?: Project;
  onDownload: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onSelectProject: (project: Project) => void;
  onPreview: (asset: Asset) => void;
  onChangeStatus: (asset: Asset) => void;
}> = ({ asset, project, onDownload, onDelete, onSelectProject, onPreview, onChangeStatus }) => {
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/?review_asset=${asset.id}`;
    navigator.clipboard.writeText(url).then(() => {
      import('react-toastify').then(({ toast }) => {
        toast.success('Review link copied to clipboard!');
      });
    });
  };

  return (
    <Card
      className="hover:border-primary transition-all duration-200 flex flex-col h-full cursor-pointer"
      onClick={() => onPreview(asset)}
    >
      <div className="flex-1">
        {/* Header: FileIcon + Asset Name */}
        <div className="flex items-start gap-3 mb-3">
          <FileIcon
            fileType={asset.file_type}
            fileName={asset.name}
            className="w-12 h-12 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-2 break-words">
              {asset.name}
            </h3>
            {asset.file_size && (
              <span className="text-xs text-muted-foreground">
                {formatFileSize(asset.file_size)}
              </span>
            )}
          </div>
        </div>

        {/* Project Badge */}
        {project && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectProject(project);
            }}
            className="inline-flex items-center gap-1.5 mb-3 text-sm hover:underline"
            style={{ color: project.color_code || '#ffffff' }}
          >
            <Icon path="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" className="w-4 h-4" />
            {project.title}
          </button>
        )}

        {/* Description */}
        {asset.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {asset.description}
          </p>
        )}

        {/* Category and Status Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {asset.category && (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary capitalize">
              {asset.category.replace('_', ' ')}
            </span>
          )}
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${assetStatusStyles[asset.status!]}`}>
            {asset.status?.replace('_', ' ')}
          </span>
        </div>

        {/* Uploader */}
        <div className="flex items-center gap-2 mb-2">
          <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" className="w-4 h-4 text-muted-foreground" />
          {asset.uploader ? (
            <div className="flex items-center gap-2">
              <Avatar
                avatarPath={asset.uploader.avatar_url}
                alt={asset.uploader.full_name || ''}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-sm text-muted-foreground">{asset.uploader.full_name}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Unknown</span>
          )}
        </div>

        {/* Upload Date */}
        <div className="flex items-center gap-2">
          <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {asset.created_at ? new Date(asset.created_at).toLocaleDateString('de-DE') : 'N/A'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChangeStatus(asset);
          }}
          className="flex-1 p-2 text-yellow-400 hover:text-yellow-300 hover:bg-muted rounded-lg transition-colors flex items-center justify-center gap-2"
          title="Change Status"
        >
          <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5" />
          <span className="text-sm font-medium">Status</span>
        </button>
        {asset.status === AssetStatus.ClientReview && (
          <button
            onClick={handleShare}
            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-muted rounded-lg transition-colors"
            title="Copy Review Link"
          >
            <Icon path="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" className="w-5 h-5" />
          </button>
        )}
        {asset.storage_path && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(asset);
            }}
            className="p-2 text-primary hover:text-blue-300 hover:bg-muted rounded-lg transition-colors"
            title="Download"
          >
            <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(asset);
          }}
          className="p-2 text-red-400 hover:text-red-300 hover:bg-muted rounded-lg transition-colors"
          title="Delete"
        >
          <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-5 h-5" />
        </button>
      </div>
    </Card>
  );
};

export const AssetList: React.FC<AssetListProps> = ({ onSelectProject, searchQuery = '' }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [statusModalAsset, setStatusModalAsset] = useState<Asset | null>(null);
  const [onlyMe, setOnlyMe] = useState(false);
  const [filters, setFilters] = useState<AssetFilters>({
    status: 'all',
    projectId: 'all',
    category: 'all',
    uploaderId: 'all',
  });
  const [sort, setSort] = useState<AssetSort>({
    field: 'created_at',
    direction: 'desc',
  });

  const { data: assets = [], isLoading: assetsLoading, error: assetsError } = useQuery({
    queryKey: ['assets'],
    queryFn: getAssets,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete asset: ${error.message}`);
    },
  });

  // Filter Logic
  const filterAssets = (assets: Asset[]): Asset[] => {
    return assets.filter(asset => {
      // Hide internal project files
      if (asset.description?.includes('[SYSTEM:PROJECT_FILE]')) return false;

      // Only Me filter
      if (onlyMe && asset.uploaded_by !== user?.id) return false;

      // Search Query Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = asset.name?.toLowerCase().includes(query);
        const matchesDesc = asset.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }

      if (filters.status !== 'all' && asset.status !== filters.status) return false;
      if (filters.projectId !== 'all' && asset.project_id !== filters.projectId) return false;
      if (filters.category !== 'all' && asset.category !== filters.category) return false;
      if (filters.uploaderId !== 'all' && asset.uploaded_by !== filters.uploaderId) return false;
      return true;
    });
  };

  // Sort Logic
  const sortAssets = (assets: Asset[]): Asset[] => {
    return [...assets].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sort.field) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'created_at':
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'category':
          aValue = a.category || '';
          bValue = b.category || '';
          break;
      }

      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Apply filters and sorting
  const filteredAndSortedAssets = sortAssets(filterAssets(assets));

  // Get active filter count
  const getActiveFilterCount = (): number => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.projectId !== 'all') count++;
    if (filters.category !== 'all') count++;
    if (filters.uploaderId !== 'all') count++;
    return count;
  };

  // Get unique uploaders from assets
  const uniqueUploaders = Array.from(
    new Set(assets.filter(a => a.uploader).map(a => a.uploaded_by))
  ).map(uploaderId => {
    const uploader = assets.find(a => a.uploaded_by === uploaderId)?.uploader;
    return { id: uploaderId, name: uploader?.full_name || 'Unknown' };
  });

  const handleDownload = async (asset: Asset) => {
    if (!asset.storage_path) {
      toast.error('No file available for download');
      return;
    }
    try {
      await downloadAsset(asset.storage_path, asset.name);
      toast.success('Download started!');
    } catch (error: any) {
      toast.error(`Failed to download: ${error.message}`);
    }
  };

  const handleDelete = (asset: Asset) => {
    if (confirm(`Are you sure you want to delete "${asset.name}"?`)) {
      deleteMutation.mutate(asset.id);
    }
  };

  if (assetsLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">All Assets</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="h-72 animate-pulse">
              <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-muted rounded w-full mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (assetsError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500 text-xl">Error loading assets. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Assets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredAndSortedAssets.length} {filteredAndSortedAssets.length === 1 ? 'asset' : 'assets'}
            {onlyMe && ' • Only Me'}
            {getActiveFilterCount() > 0 && ' (filtered)'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setOnlyMe(!onlyMe)}
            className={`font-semibold py-2 px-4 rounded-lg flex items-center transition-colors ${onlyMe
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
          >
            <Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" className="h-5 w-5 mr-2" />
            Only Me
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center"
          >
            <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" className="h-5 w-5 mr-2" />
            Upload Asset
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 bg-card border border-border rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Status Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              className="w-full bg-muted border border-input text-foreground text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5"
            >
              <option value="all">All Statuses</option>
              <option value={AssetStatus.Upload}>Upload</option>
              <option value={AssetStatus.InternalReview}>Internal Review</option>
              <option value={AssetStatus.ClientReview}>Client Review</option>
              <option value={AssetStatus.ChangesRequested}>Changes Requested</option>
              <option value={AssetStatus.Approved}>Approved</option>
              <option value={AssetStatus.Archived}>Archived</option>
            </select>
          </div>

          {/* Project Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Project
            </label>
            <select
              value={filters.projectId}
              onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
              className="w-full bg-muted border border-input text-foreground text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5"
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value as any })}
              className="w-full bg-muted border border-input text-foreground text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5"
            >
              <option value="all">All Categories</option>
              <option value={AssetType.Briefing}>Briefing</option>
              <option value={AssetType.Design}>Design</option>
              <option value={AssetType.Contract}>Contract</option>
              <option value={AssetType.Kva}>KVA</option>
              <option value={AssetType.Invoice}>Invoice</option>
              <option value={AssetType.Other}>Other</option>
            </select>
          </div>

          {/* Uploader Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Uploaded By
            </label>
            <select
              value={filters.uploaderId}
              onChange={(e) => setFilters({ ...filters, uploaderId: e.target.value })}
              className="w-full bg-muted border border-input text-foreground text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5"
            >
              <option value="all">All Uploaders</option>
              {uniqueUploaders.map(uploader => (
                <option key={uploader.id} value={uploader.id}>
                  {uploader.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Sort By
            </label>
            <div className="flex gap-2">
              <select
                value={sort.field}
                onChange={(e) => setSort({ ...sort, field: e.target.value as any })}
                className="flex-1 bg-muted border border-input text-foreground text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5"
              >
                <option value="created_at">Date Created</option>
                <option value="name">Asset Name</option>
                <option value="status">Status</option>
                <option value="category">Category</option>
              </select>
              <button
                onClick={() => setSort({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
                className="bg-muted border border-input text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg p-2.5 transition-colors"
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

          {/* Clear Filters Button */}
          {getActiveFilterCount() > 0 && (
            <div>
              <button
                onClick={() => setFilters({ status: 'all', projectId: 'all', category: 'all', uploaderId: 'all' })}
                className="bg-muted hover:bg-muted/80 text-foreground text-sm rounded-lg px-4 py-2.5 flex items-center gap-2 transition-colors"
              >
                <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
                Clear ({getActiveFilterCount()})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid or Empty State */}
      {filteredAndSortedAssets.length === 0 ? (
        <div className="text-center text-muted-foreground mt-12">
          <Icon path="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-xl mb-2">
            {getActiveFilterCount() > 0 ? 'No assets match your filters' : 'No assets found'}
          </p>
          <p className="mt-2">
            {getActiveFilterCount() > 0
              ? 'Try adjusting your filters or upload a new asset'
              : 'Upload your first asset to get started!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedAssets.map(asset => {
            const project = projects.find(p => p.id === asset.project_id);
            return (
              <AssetCard
                key={asset.id}
                asset={asset}
                project={project}
                onDownload={handleDownload}
                onDelete={handleDelete}
                onSelectProject={onSelectProject}
                onPreview={setPreviewAsset}
                onChangeStatus={setStatusModalAsset}
              />
            );
          })}
        </div>
      )}

      <AssetUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      <AssetPreviewModal
        isOpen={!!previewAsset}
        onClose={() => setPreviewAsset(null)}
        asset={previewAsset}
        onDownload={previewAsset ? () => handleDownload(previewAsset) : undefined}
      />

      <AssetStatusModal
        isOpen={!!statusModalAsset}
        onClose={() => setStatusModalAsset(null)}
        asset={statusModalAsset}
      />
    </div>
  );
};
