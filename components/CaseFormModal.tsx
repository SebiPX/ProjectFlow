import React, { useState, useEffect } from 'react';
import { X, Save, Link as LinkIcon, Calendar, CheckSquare, Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createCase, updateCase } from '../services/api/cases';
import { getProfiles } from '../services/api/profiles';
import { getAssetsByProject } from '../services/api/assets';
import { toast } from 'react-toastify';
import type { Case } from '../types/supabase';

interface CaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCase: Case | null;
  projectId?: string;
}

const STATUS_OPTIONS = [
  'Nicht auf dieser Plattform',
  'Entwurf',
  'Geplant',
  'In Bearbeitung',
  'Geposted',
];

export const CaseFormModal: React.FC<CaseFormModalProps> = ({ isOpen, onClose, editingCase, projectId }) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<Case>>({
    title: '',
    project_id: projectId || null,
    notes: '',
    category: 'Cases',
    date_posting: '',
    status_instagram: 'Nicht auf dieser Plattform',
    status_facebook: 'Nicht auf dieser Plattform',
    status_linkedin: 'Nicht auf dieser Plattform',
    status_website: 'Nicht auf dieser Plattform',
    status_youtube: 'Nicht auf dieser Plattform',
    status_tiktok: 'Nicht auf dieser Plattform',
    asset_ids: [],
    external_links: [],
  });

  const activeProjectId = editingCase?.project_id || projectId;

  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: getProfiles,
  });

  const { data: projectAssets } = useQuery({
    queryKey: ['assets', activeProjectId],
    queryFn: () => getAssetsByProject(activeProjectId!),
    enabled: !!activeProjectId,
  });

  useEffect(() => {
    if (editingCase) {
      setFormData({
        ...editingCase,
        date_posting: editingCase.date_posting ? (editingCase.date_posting as string).split('T')[0] : '', // extract YYYY-MM-DD
        asset_ids: editingCase.asset_ids || [],
        external_links: editingCase.external_links || [],
      });
    } else {
      setFormData({
        title: '',
        project_id: projectId || null,
        category: 'Cases',
        status_instagram: 'Nicht auf dieser Plattform',
        status_facebook: 'Nicht auf dieser Plattform',
        status_linkedin: 'Nicht auf dieser Plattform',
        status_website: 'Nicht auf dieser Plattform',
        status_youtube: 'Nicht auf dieser Plattform',
        status_tiktok: 'Nicht auf dieser Plattform',
        asset_ids: [],
        external_links: [],
      });
    }
  }, [editingCase, isOpen, projectId]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Case>) => {
      if (editingCase) return updateCase(editingCase.id, data);
      return createCase(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast.success(`Case ${editingCase ? 'updated' : 'created'} successfully`);
      onClose();
    },
    onError: (err: any) => {
      toast.error('Failed to save case');
      console.error(err);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      toast.error('Title is required');
      return;
    }
    saveMutation.mutate(formData);
  };

  const toggleAsset = (assetId: string) => {
    const current = formData.asset_ids || [];
    if (current.includes(assetId)) {
      setFormData({ ...formData, asset_ids: current.filter(id => id !== assetId) });
    } else {
      setFormData({ ...formData, asset_ids: [...current, assetId] });
    }
  };

  const handleExternalLinkChange = (index: number, val: string) => {
    const links = [...(formData.external_links || [])];
    links[index] = val;
    setFormData({ ...formData, external_links: links });
  };

  const addExternalLink = () => {
    setFormData(prev => ({
      ...prev,
      external_links: [...(prev.external_links || []), '']
    }));
  };

  const removeExternalLink = (index: number) => {
    const links = [...(formData.external_links || [])];
    links.splice(index, 1);
    setFormData({ ...formData, external_links: links });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-[#1A1D24] rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingCase ? 'Edit Case' : 'New Case'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Base Setup */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title / Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-[#2A2D35] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.category || 'Cases'}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-[#2A2D35] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option>Cases</option>
                  <option>Organisation</option>
                  <option>Wissen</option>
                  <option>Employer Branding</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                  <Calendar size={14} className="mr-1" /> Posting Date
                </label>
                <input
                  type="date"
                  value={formData.date_posting || ''}
                  onChange={e => setFormData({ ...formData, date_posting: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-[#2A2D35] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Editor (Assigned via Flow)
                </label>
                <select
                  value={formData.editor_id || ''}
                  onChange={e => setFormData({ ...formData, editor_id: e.target.value || null })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-[#2A2D35] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="">-- Unassigned --</option>
                  {profiles?.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assets Selection */}
            {activeProjectId && (
              <div className="bg-gray-50 dark:bg-[#2A2D35] p-5 rounded-xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <CheckSquare size={16} className="mr-2" />
                  Select Project Assets
                </h3>
                {(!projectAssets || projectAssets.length === 0) ? (
                  <p className="text-xs text-gray-500">No assets have been uploaded to this project yet.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-2">
                    {projectAssets.map(asset => (
                      <label key={asset.id} className="flex items-start space-x-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1A1D24] cursor-pointer hover:border-blue-500 transition-colors">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={(formData.asset_ids || []).includes(asset.id)}
                          onChange={() => toggleAsset(asset.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{asset.name}</p>
                          <p className="text-xs text-gray-500">{asset.status}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* External Links */}
            <div className="bg-gray-50 dark:bg-[#2A2D35] p-5 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                  <LinkIcon size={16} className="mr-2" /> External Material Links (Figma, Sharepoint, etc.)
                </h3>
                <button
                  type="button"
                  onClick={addExternalLink}
                  className="flex items-center text-xs px-3 py-1 bg-white dark:bg-[#1A1D24] border border-gray-200 dark:border-gray-700 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Plus size={14} className="mr-1" /> Add Link
                </button>
              </div>

              {(formData.external_links || []).length === 0 ? (
                <p className="text-xs text-gray-500 italic">No external links added yet.</p>
              ) : (
                <div className="space-y-3">
                  {(formData.external_links || []).map((link, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="url"
                        value={link}
                        onChange={e => handleExternalLinkChange(idx, e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-3 py-2 text-sm bg-white dark:bg-[#1A1D24] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeExternalLink(idx)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Platform Status Matrix */}
            <div className="bg-gray-50 dark:bg-[#2A2D35] p-5 rounded-xl border border-gray-100 dark:border-gray-800">
               <h3 className="text-md font-semibold text-gray-900 dark:text-white justify-between mb-4 flex">
                  Platform Publishing Status
               </h3>
               
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                 {[
                   { key: 'status_instagram', label: 'Instagram' },
                   { key: 'status_facebook', label: 'Facebook' },
                   { key: 'status_linkedin', label: 'LinkedIn' },
                   { key: 'status_website', label: 'Website' },
                   { key: 'status_youtube', label: 'YouTube' },
                   { key: 'status_tiktok', label: 'TikTok' },
                 ].map(platform => (
                   <div key={platform.key}>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                      {platform.label}
                     </label>
                     <select
                        value={(formData as any)[platform.key] || 'Nicht auf dieser Plattform'}
                        onChange={e => setFormData({ ...formData, [platform.key]: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1A1D24] border border-gray-200 dark:border-gray-700 rounded-lg"
                     >
                       {STATUS_OPTIONS.map(opt => (
                         <option key={opt}>{opt}</option>
                       ))}
                     </select>
                   </div>
                 ))}
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes / Anmerkungen
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-[#2A2D35] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
            
          </form>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A2D35] rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium disabled:opacity-50"
          >
            <Save size={18} className="mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Case'}
          </button>
        </div>
      </div>
    </div>
  );
};
