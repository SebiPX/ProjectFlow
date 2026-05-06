import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { uploadAsset } from '../services/api/assets';
import { getProjects } from '../services/api/projects';
import { AssetType, AssetStatus } from '../types/supabase';
import { useAuth } from '../lib/AuthContext';
import { Icon } from './ui/Icon';

interface AssetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string; // Optional: if uploading from project detail
}

export const AssetUploadModal: React.FC<AssetUploadModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const [files, setFiles] = useState<File[]>([]);
  const [bundleLink, setBundleLink] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: AssetType.Other,
    status: AssetStatus.Upload,
    project_id: projectId || '',
    is_visible_to_client: false,
    is_physical: false,
    location: '',
  });

  // Fetch projects for dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    enabled: isOpen && !projectId, // Only fetch if no projectId provided
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (files.length === 0) throw new Error('No files selected');
      if (!profile) throw new Error('User not authenticated');

      const uploadedAssets = await Promise.all(
        files.map((fileItem, index) => {
          let assetName = fileItem.name;
          if (formData.name) {
            assetName = files.length > 1 ? `${formData.name} - ${index + 1}` : formData.name;
          }

          return uploadAsset(fileItem, {
            name: assetName,
            description: formData.description || null,
            category: formData.category,
            status: formData.status,
            project_id: formData.project_id,
            uploaded_by: profile.id,
            is_visible_to_client: formData.is_visible_to_client,
            is_physical: formData.is_physical,
            location: formData.location || null,
            feedback_note: null,
          });
        })
      );
      return uploadedAssets;
    },
    onSuccess: (uploadedAssets) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      if (formData.project_id) {
        queryClient.invalidateQueries({ queryKey: ['assets', formData.project_id] });
      }
      
      if (uploadedAssets.length > 1) {
        const bundleIds = uploadedAssets.map(a => a.id).join(',');
        const link = `${window.location.origin}/?review_assets=${bundleIds}`;
        setBundleLink(link);
        toast.success(`${uploadedAssets.length} assets uploaded successfully!`);
      } else {
        toast.success('Asset uploaded successfully!');
        handleClose();
      }
    },
    onError: (error: any) => {
      toast.error(`Failed to upload asset: ${error.message}`);
    },
  });

  const handleClose = () => {
    setFiles([]);
    setBundleLink(null);
    setFormData({
      name: '',
      description: '',
      category: AssetType.Other,
      status: AssetStatus.Upload,
      project_id: projectId || '',
      is_visible_to_client: false,
      is_physical: false,
      location: '',
    });
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      // Auto-fill name if empty and only one file
      if (!formData.name && selectedFiles.length === 1) {
        setFormData({ ...formData, name: selectedFiles[0].name });
      } else if (!formData.name && selectedFiles.length > 1) {
        setFormData({ ...formData, name: 'Bundle Upload' });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    if (!formData.project_id) {
      toast.error('Please select a project');
      return;
    }

    uploadMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">
            {bundleLink ? 'Upload Complete' : 'Upload Asset'}
          </h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={uploadMutation.isPending}
          >
            <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6" />
          </button>
        </div>

        {bundleLink ? (
          <div className="p-6 space-y-6 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon path="M5 13l4 4L19 7" className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Bundle Link Ready!</h3>
            <p className="text-muted-foreground">Your assets have been grouped into a bundle. You can share this link for review.</p>
            
            <div className="flex items-center gap-2 mt-4 bg-muted p-2 rounded-lg border border-border">
              <input 
                type="text" 
                readOnly 
                value={bundleLink} 
                className="bg-transparent flex-1 outline-none text-sm text-foreground px-2"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(bundleLink);
                  toast.success('Bundle link copied to clipboard!');
                }}
                className="bg-primary text-primary-foreground px-4 py-2 rounded font-medium hover:bg-primary/90 transition"
              >
                Copy Link
              </button>
            </div>
            
            <button
              onClick={handleClose}
              className="mt-6 px-6 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors w-full"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              File *
            </label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-input border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Icon
                    path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    className="w-10 h-10 mb-3 text-muted-foreground"
                  />
                  {files.length > 0 ? (
                    <div className="text-center">
                      <p className="text-sm text-green-400 font-medium">
                        {files.length === 1 ? files[0].name : `${files.length} files selected`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB total
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, Word, Images, etc. (Max 50MB)
                      </p>
                    </div>
                  )}
                </div>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploadMutation.isPending}
                />
              </label>
            </div>
          </div>

          {/* Project Selection (if not pre-selected) */}
          {!projectId && (
            <div>
              <label htmlFor="project_id" className="block text-sm font-medium text-muted-foreground mb-2">
                Project *
              </label>
              <select
                id="project_id"
                required
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={uploadMutation.isPending}
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Asset Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-2">
              Asset Name {files.length <= 1 && '*'}
            </label>
            <input
              type="text"
              id="name"
              required={files.length <= 1}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Brand Guidelines 2024"
              disabled={uploadMutation.isPending}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Brief description of the asset..."
              disabled={uploadMutation.isPending}
            />
          </div>

          {/* Category & Status Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-muted-foreground mb-2">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as AssetType })}
                className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={uploadMutation.isPending}
              >
                <option value={AssetType.Briefing}>Briefing</option>
                <option value={AssetType.Design}>Design</option>
                <option value={AssetType.Contract}>Contract</option>
                <option value={AssetType.Kva}>KVA</option>
                <option value={AssetType.Invoice}>Invoice</option>
                <option value={AssetType.Other}>Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-muted-foreground mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetStatus })}
                className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={uploadMutation.isPending}
              >
                <option value={AssetStatus.Upload}>Upload</option>
                <option value={AssetStatus.InternalReview}>Internal Review</option>
                <option value={AssetStatus.ClientReview}>Client Review</option>
                <option value={AssetStatus.ChangesRequested}>Changes Requested</option>
                <option value={AssetStatus.Approved}>Approved</option>
                <option value={AssetStatus.Archived}>Archived</option>
              </select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_visible_to_client"
                checked={formData.is_visible_to_client}
                onChange={(e) => setFormData({ ...formData, is_visible_to_client: e.target.checked })}
                className="w-4 h-4 bg-muted border-input rounded focus:ring-2 focus:ring-primary"
                disabled={uploadMutation.isPending}
              />
              <label htmlFor="is_visible_to_client" className="ml-2 text-sm text-muted-foreground">
                Visible to client
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_physical"
                checked={formData.is_physical}
                onChange={(e) => setFormData({ ...formData, is_physical: e.target.checked })}
                className="w-4 h-4 bg-muted border-input rounded focus:ring-2 focus:ring-primary"
                disabled={uploadMutation.isPending}
              />
              <label htmlFor="is_physical" className="ml-2 text-sm text-muted-foreground">
                Physical asset (USB, Print, etc.)
              </label>
            </div>
          </div>

          {/* Location (for physical assets) */}
          {formData.is_physical && (
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-muted-foreground mb-2">
                Physical Location
              </label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Office Cabinet A, Shelf 2"
                disabled={uploadMutation.isPending}
              />
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
              disabled={uploadMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadMutation.isPending || !file}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploadMutation.isPending ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" className="w-5 h-5" />
                  Upload {files.length > 1 ? 'Assets' : 'Asset'}
                </>
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
