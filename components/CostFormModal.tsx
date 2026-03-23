import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { createCost, uploadCostDocument } from '../services/api/costs';
import { Icon } from './ui/Icon';

interface CostFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const costCategories = [
  'Software/Licenses',
  'External Services',
  'Marketing',
  'Hardware',
  'Travel',
  'Office Supplies',
  'Consulting',
  'Other',
];

export const CostFormModal: React.FC<CostFormModalProps> = ({ isOpen, onClose, projectId }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Other',
    is_estimated: false,
  });
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const createMutation = useMutation({
    mutationFn: createCost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs', projectId] });
      toast.success('Cost added successfully!');
      handleClose();
    },
    onError: (error: any) => {
      toast.error(`Failed to add cost: ${error.message}`);
    },
  });

  const handleClose = () => {
    setFormData({
      title: '',
      amount: '',
      category: 'Other',
      is_estimated: false,
    });
    setDocumentFile(null);
    setUploading(false);
    onClose();
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setDocumentFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setUploading(true);

      let documentPath: string | null = null;
      if (documentFile) {
        documentPath = await uploadCostDocument(projectId, documentFile);
      }

      await createMutation.mutateAsync({
        project_id: projectId,
        title: formData.title.trim(),
        amount: amount,
        category: formData.category || null,
        is_estimated: formData.is_estimated,
        invoice_document_path: documentPath,
      });
    } catch (error: any) {
      toast.error(`Failed to add cost: ${error.message}`);
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border flex-shrink-0">
          <h2 className="text-2xl font-bold text-foreground">Add Cost</h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={uploading}
          >
            <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-2">
              Title / Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Adobe Creative Cloud License"
              disabled={uploading}
            />
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-muted-foreground mb-2">
              Amount (€) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="amount"
              required
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="0.00"
              disabled={uploading}
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-muted-foreground mb-2">
              Category
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={uploading}
            >
              {costCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Is Estimated */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_estimated"
              checked={formData.is_estimated}
              onChange={(e) => setFormData({ ...formData, is_estimated: e.target.checked })}
              className="w-4 h-4 text-primary bg-muted border-input rounded focus:ring-primary"
              disabled={uploading}
            />
            <label htmlFor="is_estimated" className="ml-2 text-sm text-muted-foreground">
              This is an estimated cost
            </label>
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Invoice / Receipt (optional)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                id="document-upload"
                onChange={handleDocumentChange}
                className="hidden"
                disabled={uploading}
              />
              <label
                htmlFor="document-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-sm rounded-lg cursor-pointer transition-colors"
              >
                <Icon path="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" className="w-4 h-4" />
                {documentFile ? 'Change File' : 'Attach File'}
              </label>
              {documentFile && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {documentFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDocumentFile(null)}
                    className="text-red-400 hover:text-red-300"
                    disabled={uploading}
                  >
                    <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, images, or documents. Max size 10MB.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Icon
                    path="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    className="w-4 h-4 animate-spin"
                  />
                  Adding...
                </>
              ) : (
                <>
                  <Icon path="M12 4v16m8-8H4" className="w-5 h-5" />
                  Add Cost
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
