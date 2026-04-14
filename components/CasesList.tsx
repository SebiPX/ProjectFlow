import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { getCases, deleteCase } from '../services/api/cases';
import { CaseFormModal } from './CaseFormModal';
import { toast } from 'react-toastify';
import type { Case } from '../types/supabase';

export const CasesList: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: getCases,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast.success('Case deleted successfully');
    },
    onError: () => toast.error('Failed to delete case'),
  });

  const handleEdit = (c: Case) => {
    setEditingCase(c);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingCase(null);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this case?')) {
      deleteMutation.mutate(id);
    }
  };

  const renderStatusBadge = (status: string | undefined) => {
    if (!status || status === 'Nicht auf dieser Plattform') return <span className="text-gray-400 text-xs">N/A</span>;
    if (status === 'Geposted') return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{status}</span>;
    if (status === 'Geplant') return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{status}</span>;
    if (status === 'In Bearbeitung') return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">{status}</span>;
    return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">{status}</span>;
  };

  if (isLoading) return <div>Loading cases...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Cases & Portfolio
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage project cases across platforms</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
        >
          <Plus size={18} className="mr-2" />
          Add Case
        </button>
      </div>

      <div className="bg-white dark:bg-[#1A1D24] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-[#2A2D35] text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="p-4 font-semibold">Case</th>
                <th className="p-4 font-semibold">Project</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 text-center font-semibold">Insta</th>
                <th className="p-4 text-center font-semibold">Fb</th>
                <th className="p-4 text-center font-semibold">LI</th>
                <th className="p-4 text-center font-semibold">Web</th>
                <th className="p-4 text-center font-semibold">YT</th>
                <th className="p-4 text-center font-semibold">TikTok</th>
                <th className="p-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {cases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No cases defined yet.
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-[#2A2D35]/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900 dark:text-white">{c.title}</div>
                      <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
                         {c.date_posting ? new Date(c.date_posting).toLocaleDateString() : 'No date'}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                      {c.project ? (
                        <span className="inline-flex items-center">
                          {c.project.title}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">No Project</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{c.category || '-'}</td>
                    
                    <td className="p-4 text-center">{renderStatusBadge(c.status_instagram)}</td>
                    <td className="p-4 text-center">{renderStatusBadge(c.status_facebook)}</td>
                    <td className="p-4 text-center">{renderStatusBadge(c.status_linkedin)}</td>
                    <td className="p-4 text-center">{renderStatusBadge(c.status_website)}</td>
                    <td className="p-4 text-center">{renderStatusBadge(c.status_youtube)}</td>
                    <td className="p-4 text-center">{renderStatusBadge(c.status_tiktok)}</td>

                    <td className="p-4">
                      <div className="flex items-center justify-end space-x-2">
                        {c.material_link && (
                          <a href={c.material_link} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="View Material">
                            <ExternalLink size={16} />
                          </a>
                        )}
                        <button
                          onClick={() => handleEdit(c)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-[#2A2D35] rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-[#2A2D35] rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <CaseFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          editingCase={editingCase}
        />
      )}
    </div>
  );
};
