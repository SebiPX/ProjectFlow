import React, { useState, useEffect } from 'react';
import { X, Save, Link as LinkIcon, Folder, Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createCase, updateCase } from '../services/api/cases';
import { getProjects } from '../services/api/projects';
import { getProfiles } from '../services/api/profiles';
import { toast } from 'react-toastify';
import type { Case } from '../types/supabase';

interface CaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCase: Case | null;
}

const STATUS_OPTIONS = [
  'Nicht auf dieser Plattform',
  'Entwurf',
  'Geplant',
  'In Bearbeitung',
  'Geposted',
];

export const CaseFormModal: React.FC<CaseFormModalProps> = ({ isOpen, onClose, editingCase }) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<Case>>({
    title: '',
    project_id: null,
    notes: '',
    category: 'Cases',
    material_status: '',
    material_link: '',
    date_posting: '',
    status_instagram: 'Nicht auf dieser Plattform',
    status_facebook: 'Nicht auf dieser Plattform',
    status_linkedin: 'Nicht auf dieser Plattform',
    status_website: 'Nicht auf dieser Plattform',
    status_youtube: 'Nicht auf dieser Plattform',
    status_tiktok: 'Nicht auf dieser Plattform',
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: getProfiles,
  });

  useEffect(() => {
    if (editingCase) {
      setFormData({
        ...editingCase,
        date_posting: editingCase.date_posting ? (editingCase.date_posting as string).split('T')[0] : '', // extract YYYY-MM-DD
      });
    } else {
      setFormData({
        title: '',
        project_id: null,
        category: 'Cases',
        status_instagram: 'Nicht auf dieser Plattform',
        status_facebook: 'Nicht auf dieser Plattform',
        status_linkedin: 'Nicht auf dieser Plattform',
        status_website: 'Nicht auf dieser Plattform',
        status_youtube: 'Nicht auf dieser Plattform',
        status_tiktok: 'Nicht auf dieser Plattform',
      });
    }
  }, [editingCase, isOpen]);

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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                  <Folder size={14} className="mr-1" /> Bound to Project
                </label>
                <select
                  value={formData.project_id || ''}
                  onChange={e => {
                    const pid = e.target.value || null;
                    const proj = projects?.find(p => p.id === pid);
                    setFormData(prev => ({
                      ...prev,
                      project_id: pid,
                      // Auto-fill title if empty
                      title: (!prev.title && proj) ? proj.title : prev.title
                    }));
                  }}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-[#2A2D35] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="">-- No Project (Standalone) --</option>
                  {projects?.map(p => (
                    <option key={p.id} value={p.id}>{p.project_number} - {p.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                <LinkIcon size={14} className="mr-1" /> Material Link (SharePoint / R2)
              </label>
              <input
                type="url"
                value={formData.material_link || ''}
                onChange={e => setFormData({ ...formData, material_link: e.target.value })}
                placeholder="https://pixelschickeriacom.sharepoint.com/..."
                className="w-full px-4 py-2 bg-gray-50 dark:bg-[#2A2D35] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
              />
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
