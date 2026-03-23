import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Icon } from './ui/Icon';
import { updateAsset } from '../services/api/assets';
import type { Asset, AssetStatus } from '../types/supabase';

interface AssetStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
}

const statusOptions: { value: AssetStatus; label: string; color: string; icon: string }[] = [
  {
    value: 'upload' as AssetStatus,
    label: 'Upload',
    color: 'bg-gray-500/20 text-muted-foreground',
    icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
  },
  {
    value: 'internal_review' as AssetStatus,
    label: 'Internal Review',
    color: 'bg-primary/20 text-primary',
    icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  },
  {
    value: 'client_review' as AssetStatus,
    label: 'Client Review',
    color: 'bg-purple-500/20 text-purple-400',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    value: 'changes_requested' as AssetStatus,
    label: 'Changes Requested',
    color: 'bg-yellow-500/20 text-yellow-400',
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  },
  {
    value: 'approved' as AssetStatus,
    label: 'Approved',
    color: 'bg-green-500/20 text-green-400',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    value: 'archived' as AssetStatus,
    label: 'Archived',
    color: 'bg-muted/80/20 text-muted-foreground',
    icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
  },
];

export const AssetStatusModal: React.FC<AssetStatusModalProps> = ({
  isOpen,
  onClose,
  asset,
}) => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<AssetStatus | null>(
    asset?.status || null
  );
  const [feedbackNote, setFeedbackNote] = useState(asset?.feedback_note || '');
  const [loading, setLoading] = useState(false);

  // Update selected status when asset changes
  React.useEffect(() => {
    if (asset) {
      setSelectedStatus(asset.status || null);
      setFeedbackNote(asset.feedback_note || '');
    }
  }, [asset]);

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!asset || !selectedStatus) throw new Error('Asset or status not selected');

      return updateAsset(asset.id, {
        status: selectedStatus,
        feedback_note: feedbackNote.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assets', asset?.project_id] });
      toast.success('Asset status updated successfully!');
      handleClose();
    },
    onError: (error: any) => {
      toast.error(`Failed to update status: ${error.message}`);
      setLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }
    setLoading(true);
    updateStatusMutation.mutate();
  };

  const handleClose = () => {
    setSelectedStatus(asset?.status || null);
    setFeedbackNote(asset?.feedback_note || '');
    setLoading(false);
    onClose();
  };

  if (!isOpen || !asset) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-foreground">Update Asset Status</h2>
            <p className="text-sm text-muted-foreground mt-1">{asset.name}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={loading}
          >
            <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* Current Status */}
            <div className="p-4 bg-muted/50 rounded-lg border border-input">
              <p className="text-sm text-muted-foreground mb-1">Current Status:</p>
              <div className="flex items-center gap-2">
                {statusOptions
                  .filter((opt) => opt.value === asset.status)
                  .map((opt) => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <Icon path={opt.icon} className="w-5 h-5" />
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${opt.color}`}>
                        {opt.label}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Status Options */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                New Status <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {statusOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => setSelectedStatus(option.value)}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${
                        selectedStatus === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-input bg-muted/50 hover:border-gray-500'
                      }
                     text-primary-foreground`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon path={option.icon} className="w-6 h-6" />
                      <div className="flex-1">
                        <span className={`font-medium ${option.color}`}>
                          {option.label}
                        </span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedStatus === option.value
                            ? 'border-primary bg-primary'
                            : 'border-gray-500'
                        } text-primary-foreground`}
                      >
                        {selectedStatus === option.value && (
                          <Icon path="M5 13l4 4L19 7" className="w-3 h-3 text-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback Note */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Feedback / Notes
              </label>
              <textarea
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                placeholder="Add feedback or notes about this status change..."
                rows={4}
                className="w-full bg-muted border border-input text-foreground placeholder-gray-400 text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Optional: Add context about this status change (visible to team and client if applicable)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={loading || !selectedStatus}
              >
                {loading ? (
                  <>
                    <Icon
                      path="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      className="w-4 h-4 animate-spin"
                    />
                    Updating...
                  </>
                ) : (
                  <>
                    <Icon path="M5 13l4 4L19 7" className="w-5 h-5" />
                    Update Status
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
