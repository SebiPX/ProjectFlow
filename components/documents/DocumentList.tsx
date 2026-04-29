import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectDocuments, createDocument, deleteDocument, duplicateDocument, AgencyDocument } from '../../services/api/documents';
import { getAssetsByProject, uploadAsset, downloadAsset, deleteAsset } from '../../services/api/assets';
import { Asset } from '../../types/supabase';
import { Icon } from '../ui/Icon';
import { toast } from 'react-toastify';
import { ShotlistEditor } from './ShotlistEditor';
import { CallSheetEditor } from './CallSheetEditor';
import { AssetPreviewModal } from '../AssetPreviewModal';

interface DocumentListProps {
  projectId: string;
  projectTitle: string;
  pjmEmail: string;
  isClient: boolean;
  isAdminOrPJM: boolean;
}

export const DocumentList: React.FC<DocumentListProps> = ({ projectId, projectTitle, pjmEmail, isClient, isAdminOrPJM }) => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<AgencyDocument | null>(null);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => getProjectDocuments(projectId),
  });

  const { data: projectFiles = [], isLoading: filesLoading } = useQuery({
    queryKey: ['assets', projectId],
    queryFn: () => getAssetsByProject(projectId),
    select: (data) => data.filter(a => a.description?.includes('[SYSTEM:PROJECT_FILE]'))
  });

  const createMutation = useMutation({
    mutationFn: ({ title, type }: { title: string; type: 'shotlist' | 'call_sheet' }) =>
      createDocument(projectId, title, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      toast.success('Document created successfully');
      setIsCreating(false);
    },
    onError: (err: any) => {
      toast.error(`Failed to create document: ${err.message}`);
      setIsCreating(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      toast.success('Document deleted');
    },
    onError: (err: any) => {
      toast.error(`Failed to delete: ${err.message}`);
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      toast.success('Document duplicated successfully');
    },
    onError: (err: any) => {
      toast.error(`Failed to duplicate: ${err.message}`);
    }
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      return uploadAsset(file, {
        project_id: projectId,
        name: file.name,
        description: '[SYSTEM:PROJECT_FILE]',
        category: 'other' as any,
        status: 'upload' as any,
        is_visible_to_client: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', projectId] });
      toast.success('File uploaded successfully');
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err: any) => {
      toast.error(`Failed to upload file: ${err.message}`);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  });

  const deleteFileMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', projectId] });
      toast.success('File deleted');
    },
    onError: (err: any) => {
      toast.error(`Failed to delete file: ${err.message}`);
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      uploadFileMutation.mutate(file);
    }
  };

  const handleCreate = (type: 'shotlist' | 'call_sheet' | 'event_sheet') => {
    setIsCreating(true);
    let title = 'New Document';
    
    if (type === 'call_sheet') {
      const existingDispos = documents.filter((d: AgencyDocument) => d.type === 'call_sheet').length;
      title = `${projectTitle} - Dispo v${existingDispos + 1}`;
    } else if (type === 'event_sheet') {
      const existingEvents = documents.filter((d: AgencyDocument) => d.type === 'event_sheet').length;
      title = `${projectTitle} - Event Dispo v${existingEvents + 1}`;
    } else if (type === 'shotlist') {
      const existingShotlists = documents.filter((d: AgencyDocument) => d.type === 'shotlist').length;
      title = `${projectTitle} - Shotlist v${existingShotlists + 1}`;
    }
    createMutation.mutate({ title, type });
  };

  if (docsLoading) {
    return <div className="p-6 text-muted-foreground">Loading documents...</div>;
  }

  if (selectedDocument) {
    if (selectedDocument.type === 'shotlist') {
      return <ShotlistEditor documentId={selectedDocument.id} pjmEmail={pjmEmail} projectTitle={projectTitle} onBack={() => setSelectedDocument(null)} isAdminOrPJM={isAdminOrPJM} />;
    } else {
      return <CallSheetEditor documentId={selectedDocument.id} pjmEmail={pjmEmail} projectTitle={projectTitle} onBack={() => setSelectedDocument(null)} isAdminOrPJM={isAdminOrPJM} />;
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Project Documents</h2>
          <p className="text-sm text-muted-foreground">Manage your Dispos, Shotlists, and more.</p>
        </div>
        {!isClient && (
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-lg transition-colors flex items-center gap-2"
            >
              <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" className="w-5 h-5" />
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors flex items-center gap-2"
              >
                <Icon path="M12 4v16m8-8H4" className="w-5 h-5" />
                New Document
                <Icon path={isDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} className="w-4 h-4 ml-1" />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleCreate('call_sheet');
                    }}
                    disabled={isCreating}
                    className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center gap-3 border-b border-border/50 text-sm font-medium text-foreground"
                  >
                    <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="w-4 h-4 text-primary" />
                    Drehdispo
                  </button>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleCreate('event_sheet');
                    }}
                    disabled={isCreating}
                    className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center gap-3 border-b border-border/50 text-sm font-medium text-foreground"
                  >
                    <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-4 h-4 text-purple-500" />
                    Eventdispo
                  </button>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleCreate('shotlist');
                    }}
                    disabled={isCreating}
                    className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center gap-3 text-sm font-medium text-foreground"
                  >
                    <Icon path="M4 6h16M4 10h16M4 14h16M4 18h16" className="w-4 h-4 text-secondary" />
                    Shotlist
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-lg">
          <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold text-foreground">No documents yet</h3>
          <p className="text-muted-foreground text-sm">Create a Call Sheet or Shotlist to start coordinating your production.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc: AgencyDocument) => (
            <div key={doc.id} onClick={() => setSelectedDocument(doc)} className="bg-card cursor-pointer group rounded-xl border border-border overflow-hidden hover:border-primary transition-all shadow-sm">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-lg flex-shrink-0 ${doc.type === 'shotlist' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {doc.type === 'shotlist' ? (
                      <Icon path="M4 6h16M4 10h16M4 14h16M4 18h16" className="w-6 h-6" />
                    ) : (
                      <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="w-6 h-6" />
                    )}
                  </div>
                  {!isClient && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); duplicateMutation.mutate(doc.id); }}
                        className="text-muted-foreground hover:text-blue-400 p-1"
                        title="Duplicate"
                      >
                        <Icon path="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); if (confirm('Delete document?')) deleteMutation.mutate(doc.id); }}
                        className="text-muted-foreground hover:text-red-400 p-1"
                        title="Delete"
                      >
                        <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{doc.title}</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {doc.type === 'shotlist' ? 'Shotlist' : 'Drehdispo (Call Sheet)'} • Created {new Date(doc.created_at).toLocaleDateString()}
                </p>
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" className="w-3 h-3" />
                    {doc.author_name || 'System'}
                  </span>
                  <span className="text-xs text-primary font-medium flex items-center gap-1">
                    Open <Icon path="M14 5l7 7m0 0l-7 7m7-7H3" className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {projectFiles.length > 0 && (
        <div className="mt-12">
          <h3 className="text-lg font-bold text-foreground mb-4 border-b border-border pb-2">Project Files</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {projectFiles.map((file: Asset) => (
              <div 
                key={file.id} 
                className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary transition-all shadow-sm flex flex-col cursor-pointer"
                onClick={() => setPreviewAsset(file)}
              >
                <div className="p-4 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 rounded-lg bg-secondary/20 text-secondary flex-shrink-0">
                      <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="w-5 h-5" />
                    </div>
                    {!isClient && (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (confirm('Delete file?')) deleteFileMutation.mutate(file.id); 
                        }}
                        className="text-muted-foreground hover:text-red-400 p-1"
                        title="Delete"
                      >
                        <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-foreground truncate" title={file.name}>{file.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Uploaded {new Date(file.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-muted/30 p-3 border-t border-border flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (file.storage_path) downloadAsset(file.storage_path, file.name);
                    }}
                    className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                  >
                    <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-3 h-3" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AssetPreviewModal
        isOpen={!!previewAsset}
        onClose={() => setPreviewAsset(null)}
        asset={previewAsset}
        onDownload={previewAsset ? () => {
          if (previewAsset.storage_path) downloadAsset(previewAsset.storage_path, previewAsset.name);
        } : undefined}
      />
    </div>
  );
};
