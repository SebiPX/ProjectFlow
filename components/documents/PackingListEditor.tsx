import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectDocuments, updateDocumentTitle, getDocumentDetails, addPackingListItem, updatePackingListItem, deletePackingListItem, AgencyDocument, PackingListItem } from '../../services/api/documents';
import { getInventarItems, InventarItem } from '../../services/api/inventar';
import { Icon } from '../ui/Icon';
import { toast } from 'react-toastify';

interface PackingListEditorProps {
  documentId: string;
  projectTitle: string;
  onBack: () => void;
  isAdminOrPJM: boolean;
}

export const PackingListEditor: React.FC<PackingListEditorProps> = ({ documentId, projectTitle, onBack, isAdminOrPJM }) => {
  const queryClient = useQueryClient();
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [titleEditValue, setTitleEditValue] = useState('');
  const [isInventarModalOpen, setIsInventarModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInventarIds, setSelectedInventarIds] = useState<Set<string>>(new Set());

  // Data fetching
  const { data: document, isLoading } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => getDocumentDetails(documentId)
  });

  const { data: inventarItems = [] } = useQuery({
    queryKey: ['inventarItems'],
    queryFn: getInventarItems,
    enabled: isInventarModalOpen,
  });

  const updateTitleMutation = useMutation({
    mutationFn: (newTitle: string) => updateDocumentTitle(documentId, newTitle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] }); // Invalidate all documents list
      setIsTitleEditing(false);
      toast.success('Title updated');
    }
  });

  const addItemMutation = useMutation({
    mutationFn: (item: Partial<PackingListItem>) => addPackingListItem(documentId, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      toast.success('Item added');
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<PackingListItem> & { id: string }) => updatePackingListItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: deletePackingListItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      toast.success('Item deleted');
    }
  });

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleEditValue.trim() && titleEditValue !== document?.title) {
      updateTitleMutation.mutate(titleEditValue.trim());
    } else {
      setIsTitleEditing(false);
    }
  };

  const startTitleEdit = () => {
    setTitleEditValue(document?.title || '');
    setIsTitleEditing(true);
  };

  const handleAddManualItem = () => {
    const nextOrder = document?.items?.length || 0;
    addItemMutation.mutate({
      name: 'New Item',
      category: 'General',
      quantity: 1,
      weight_kg: 0,
      is_packed: false,
      order_index: nextOrder
    });
  };

  const handleSaveInventarSelection = () => {
    const nextOrder = document?.items?.length || 0;
    const selectedItems = inventarItems.filter((i: InventarItem) => selectedInventarIds.has(i.id));
    
    // For simplicity, we could add them sequentially, or just do a Promise.all
    Promise.all(selectedItems.map((item: InventarItem, index: number) => 
      addItemMutation.mutateAsync({
        inventar_item_id: item.id,
        name: item.geraet + (item.modell ? ` ${item.modell}` : ''),
        category: item.department || 'Equipment',
        quantity: 1,
        weight_kg: Number(item.gewicht) || 0,
        is_packed: false,
        order_index: nextOrder + index
      })
    )).then(() => {
      setIsInventarModalOpen(false);
      setSelectedInventarIds(new Set());
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const totalWeight = useMemo(() => {
    if (!document?.items) return 0;
    return document.items.reduce((sum: number, item: PackingListItem) => sum + (Number(item.quantity) * Number(item.weight_kg)), 0);
  }, [document?.items]);

  const filteredInventar = useMemo(() => {
    if (!searchQuery) return inventarItems;
    const lowerQ = searchQuery.toLowerCase();
    return inventarItems.filter((i: InventarItem) => 
      i.geraet?.toLowerCase().includes(lowerQ) || 
      i.modell?.toLowerCase().includes(lowerQ) ||
      i.px_nummer?.toLowerCase().includes(lowerQ)
    );
  }, [inventarItems, searchQuery]);

  if (isLoading || !document) return <div className="p-6">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-background print:bg-white print:block">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border p-4 flex justify-between items-center print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Icon path="M10 19l-7-7m0 0l7-7m-7 7h18" className="w-5 h-5" />
          </button>
          
          {isTitleEditing ? (
            <form onSubmit={handleTitleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={titleEditValue}
                onChange={e => setTitleEditValue(e.target.value)}
                className="px-3 py-1 bg-muted border-none rounded text-lg font-bold w-64 focus:ring-2 focus:ring-primary outline-none"
                autoFocus
                onBlur={handleTitleSubmit}
              />
            </form>
          ) : (
            <div className="flex items-center gap-2 group cursor-pointer" onClick={startTitleEdit}>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" className="w-6 h-6 text-orange-500" />
                {document.title}
              </h2>
              <Icon path="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold bg-muted px-4 py-2 rounded-lg text-foreground">
            Total Weight: <span className="text-orange-500">{totalWeight.toFixed(2)} kg</span>
          </div>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Icon path="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" className="w-5 h-5" />
            Print PDF
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto p-6 max-w-6xl mx-auto w-full">
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 w-16 text-center">Packed</th>
                  <th className="px-4 py-3">Item Name</th>
                  <th className="px-4 py-3 w-48">Category</th>
                  <th className="px-4 py-3 w-32 text-center">Qty</th>
                  <th className="px-4 py-3 w-32 text-right">Unit Wt (kg)</th>
                  <th className="px-4 py-3 w-32 text-right">Total Wt (kg)</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {document.items?.map((item: PackingListItem) => (
                  <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => updateItemMutation.mutate({ id: item.id, is_packed: !item.is_packed })}
                        className={`w-6 h-6 rounded border flex items-center justify-center transition-colors mx-auto ${item.is_packed ? 'bg-green-500 border-green-500 text-white' : 'border-border text-transparent hover:border-green-500'}`}
                      >
                        <Icon path="M5 13l4 4L19 7" className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={item.name}
                        onChange={(e) => updateItemMutation.mutate({ id: item.id, name: e.target.value })}
                        className={`w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded px-2 py-1 ${item.is_packed ? 'text-muted-foreground line-through' : 'text-foreground font-medium'}`}
                        placeholder="Item name"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={item.category || ''}
                        onChange={(e) => updateItemMutation.mutate({ id: item.id, category: e.target.value })}
                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded px-2 py-1 text-foreground"
                        placeholder="Category"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItemMutation.mutate({ id: item.id, quantity: parseInt(e.target.value) || 1 })}
                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded px-2 py-1 text-foreground text-center"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={item.weight_kg}
                        onChange={(e) => updateItemMutation.mutate({ id: item.id, weight_kg: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-primary rounded px-2 py-1 text-foreground text-right"
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground font-medium">
                      {(item.quantity * item.weight_kg).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          if (confirm('Delete item?')) deleteItemMutation.mutate(item.id);
                        }}
                        className="text-muted-foreground hover:text-red-400 p-1"
                      >
                        <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {(!document.items || document.items.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No items in this packing list yet. Add from Inventory or manually.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-border bg-muted/30 flex justify-between items-center">
            <div className="flex gap-3">
              <button
                onClick={() => setIsInventarModalOpen(true)}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg flex items-center gap-2 font-medium transition-colors"
              >
                <Icon path="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" className="w-4 h-4" />
                Add from Inventar
              </button>
              <button
                onClick={handleAddManualItem}
                className="px-4 py-2 border border-border hover:bg-muted text-foreground rounded-lg flex items-center gap-2 font-medium transition-colors"
              >
                <Icon path="M12 4v16m8-8H4" className="w-4 h-4" />
                Add Manual Item
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inventar Selection Modal */}
      {isInventarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
              <h2 className="text-lg font-bold text-foreground">Select Items from Inventar</h2>
              <button onClick={() => setIsInventarModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, model, PX-Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground uppercase text-xs sticky top-0">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">
                      <input 
                        type="checkbox" 
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInventarIds(new Set(filteredInventar.map((i: InventarItem) => i.id)));
                          } else {
                            setSelectedInventarIds(new Set());
                          }
                        }}
                        checked={filteredInventar.length > 0 && selectedInventarIds.size === filteredInventar.length}
                        className="rounded border-border text-primary focus:ring-primary bg-background"
                      />
                    </th>
                    <th className="px-4 py-3">PX-Nr</th>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3 text-right">Weight (kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredInventar.map((item: InventarItem) => (
                    <tr key={item.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => {
                      const newSet = new Set(selectedInventarIds);
                      if (newSet.has(item.id)) newSet.delete(item.id);
                      else newSet.add(item.id);
                      setSelectedInventarIds(newSet);
                    }}>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedInventarIds.has(item.id)}
                          readOnly
                          className="rounded border-border text-primary focus:ring-primary bg-background"
                        />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{item.px_nummer || '-'}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{item.geraet}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.modell || '-'}</td>
                      <td className="px-4 py-3 text-right">{item.gewicht ? Number(item.gewicht).toFixed(2) : '0.00'}</td>
                    </tr>
                  ))}
                  {filteredInventar.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No items found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
              <button
                onClick={() => setIsInventarModalOpen(false)}
                className="px-4 py-2 hover:bg-muted text-foreground rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInventarSelection}
                disabled={selectedInventarIds.size === 0}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
              >
                Add {selectedInventarIds.size} Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


