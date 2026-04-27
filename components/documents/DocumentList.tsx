import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectDocuments, createDocument, deleteDocument, AgencyDocument } from '../../services/api/documents';
import { Icon } from '../ui/Icon';
import { toast } from 'react-toastify';
import { ShotlistEditor } from './ShotlistEditor';
import { CallSheetEditor } from './CallSheetEditor';

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
  const [selectedDocument, setSelectedDocument] = useState<AgencyDocument | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => getProjectDocuments(projectId),
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

  const handleCreate = (type: 'shotlist' | 'call_sheet') => {
    setIsCreating(true);
    let title = type === 'shotlist' ? 'New Shotlist' : 'New Drehdispo';
    if (type === 'call_sheet') {
      const existingDispos = documents.filter((d: AgencyDocument) => d.type === 'call_sheet').length;
      title = `${projectTitle} - Dispo v${existingDispos + 1}`;
    }
    createMutation.mutate({ title, type });
  };

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Loading documents...</div>;
  }

  if (selectedDocument) {
    if (selectedDocument.type === 'shotlist') {
      return <ShotlistEditor documentId={selectedDocument.id} onBack={() => setSelectedDocument(null)} isAdminOrPJM={isAdminOrPJM} />;
    } else {
      return <CallSheetEditor documentId={selectedDocument.id} pjmEmail={pjmEmail} onBack={() => setSelectedDocument(null)} isAdminOrPJM={isAdminOrPJM} />;
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
                    <button 
                      onClick={(e) => { e.stopPropagation(); if (confirm('Delete document?')) deleteMutation.mutate(doc.id); }}
                      className="text-muted-foreground hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-5 h-5" />
                    </button>
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
    </div>
  );
};
