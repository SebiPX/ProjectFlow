import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getDocumentDetails, 
  updateDocumentTitle, 
  createShotlistItem, 
  updateShotlistItem, 
  deleteShotlistItem,
  AgencyDocument,
  ShotlistItem 
} from '../../services/api/documents';
import { Icon } from '../ui/Icon';
import { toast } from 'react-toastify';
// We'll use getAssetSignedUrl or a direct upload if available. For now, we mock.
// import { uploadFile } from '../../services/api/upload';

interface ShotlistEditorProps {
  documentId: string;
  onBack: () => void;
  isAdminOrPJM: boolean;
}

export const ShotlistEditor: React.FC<ShotlistEditorProps> = ({ documentId, onBack, isAdminOrPJM }) => {
  const queryClient = useQueryClient();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  const { data: doc, isLoading } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => getDocumentDetails(documentId),
  });

  useEffect(() => {
    if (doc?.title) {
      setTitleInput(doc.title);
    }
  }, [doc?.title]);

  const updateTitleMutation = useMutation({
    mutationFn: (newTitle: string) => updateDocumentTitle(documentId, newTitle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents', doc?.project_id] });
      setIsEditingTitle(false);
      toast.success('Title updated');
    }
  });

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleInput.trim() !== doc?.title) {
      updateTitleMutation.mutate(titleInput);
    } else {
      setIsEditingTitle(false);
    }
  };

  const createItemMutation = useMutation({
    mutationFn: (data: Partial<ShotlistItem>) => createShotlistItem(documentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<ShotlistItem> }) => updateShotlistItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: deleteShotlistItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    }
  });

  const handleCreateRow = () => {
    const items: ShotlistItem[] = doc?.items || [];
    const nextOrder = items.length > 0 ? Math.max(...items.map(i => i.order_index)) + 1 : 0;
    createItemMutation.mutate({ order_index: nextOrder, scene_number: `S${nextOrder + 1}` });
  };

  const handleCellChange = (itemId: string, field: keyof ShotlistItem, value: string) => {
    updateItemMutation.mutate({ id: itemId, data: { [field]: value } });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info('Uploading image... (Mocked for now)');
      // const uploadRes = await uploadFile(file);
      // Mocking upload with local URL object for immediate display until a dedicated upload endpoint is exposed
      const mockUrl = URL.createObjectURL(file);
      updateItemMutation.mutate({ id: itemId, data: { image_url: mockUrl } });
      toast.success('Image loaded locally');
    } catch (err: any) {
      toast.error('Upload failed');
    }
  };

  if (isLoading) return <div className="p-6">Loading Shotlist...</div>;
  if (!doc) return <div className="p-6 text-red-500">Document not found</div>;

  const items: ShotlistItem[] = doc.items || [];

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
            <Icon path="M10 19l-7-7m0 0l7-7m-7 7h18" className="w-5 h-5" />
          </button>
          
          {isEditingTitle && isAdminOrPJM ? (
            <form onSubmit={handleTitleSubmit} className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="bg-muted border border-border rounded px-3 py-1 text-lg font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                onBlur={handleTitleSubmit}
              />
            </form>
          ) : (
            <h1 
              className="text-2xl font-bold text-foreground flex items-center gap-2 cursor-pointer group"
              onClick={() => isAdminOrPJM && setIsEditingTitle(true)}
            >
              {doc.title}
              {isAdminOrPJM && <Icon path="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2">
           <button 
             className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm"
             onClick={() => window.print()}
           >
             <Icon path="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" className="w-4 h-4" />
             Export PDF
           </button>
           {isAdminOrPJM && (
             <button
               onClick={handleCreateRow}
               className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2 text-sm"
             >
               <Icon path="M12 4v16m8-8H4" className="w-4 h-4" />
               Add Shot
             </button>
           )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3 w-16">Szene</th>
                <th className="px-4 py-3 w-48">Name/Inhalt</th>
                <th className="px-4 py-3 w-24">Framing</th>
                <th className="px-4 py-3 w-16">Take</th>
                <th className="px-4 py-3 w-24">Dauer</th>
                <th className="px-4 py-3">Darsteller</th>
                <th className="px-4 py-3">Props/Notizen</th>
                <th className="px-4 py-3 w-32 border-l border-border text-center">Referenzbild</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item, index) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-3 text-muted-foreground/50 cursor-grab active:cursor-grabbing">
                    <Icon path="M4 8h16M4 16h16" className="w-4 h-4" />
                  </td>
                  <td className="px-2 py-2">
                    <input 
                      type="text" 
                      defaultValue={item.scene_number} 
                      onBlur={(e) => handleCellChange(item.id, 'scene_number', e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded px-2 py-1"
                      disabled={!isAdminOrPJM}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input 
                      type="text" 
                      defaultValue={item.scene_name} 
                      onBlur={(e) => handleCellChange(item.id, 'scene_name', e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded px-2 py-1"
                      disabled={!isAdminOrPJM}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input 
                      type="text" 
                      defaultValue={item.framing} 
                      onBlur={(e) => handleCellChange(item.id, 'framing', e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded px-2 py-1 placeholder-muted-foreground/50"
                      placeholder="MCU / CU..."
                      disabled={!isAdminOrPJM}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input 
                      type="text" 
                      defaultValue={item.take} 
                      onBlur={(e) => handleCellChange(item.id, 'take', e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded px-2 py-1 text-center"
                      disabled={!isAdminOrPJM}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input 
                      type="text" 
                      defaultValue={item.duration} 
                      onBlur={(e) => handleCellChange(item.id, 'duration', e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded px-2 py-1 text-center"
                      placeholder="00m00s"
                      disabled={!isAdminOrPJM}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input 
                      type="text" 
                      defaultValue={item.cast_list} 
                      onBlur={(e) => handleCellChange(item.id, 'cast_list', e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded px-2 py-1"
                      disabled={!isAdminOrPJM}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <textarea 
                      defaultValue={item.notes} 
                      onBlur={(e) => handleCellChange(item.id, 'notes', e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded px-2 py-1 resize-none h-8 text-sm"
                      disabled={!isAdminOrPJM}
                      placeholder="Props..."
                    />
                  </td>
                  <td className="px-0 py-0 border-l border-border text-center align-middle hover:bg-muted/50 transition-colors relative cursor-pointer" onClick={() => document.getElementById(`uploader-${item.id}`)?.click()}>
                     {item.image_url ? (
                       <img src={item.image_url} alt="Reference" className="w-full h-16 object-cover" />
                     ) : (
                       <div className="w-full h-16 flex items-center justify-center text-muted-foreground/30 hover:text-primary transition-colors">
                         <Icon path="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-6 h-6" />
                       </div>
                     )}
                     <input 
                       id={`uploader-${item.id}`}
                       type="file" 
                       accept="image/*" 
                       className="hidden" 
                       onChange={(e) => handleImageUpload(e, item.id)}
                       disabled={!isAdminOrPJM}
                     />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isAdminOrPJM && (
                      <button 
                        onClick={() => { if(confirm('Delete shot?')) deleteItemMutation.mutate(item.id); }}
                        className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-muted-foreground">
                    <p className="mb-4">No shots in this list yet.</p>
                    {isAdminOrPJM && (
                      <button onClick={handleCreateRow} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                        Add First Shot
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
