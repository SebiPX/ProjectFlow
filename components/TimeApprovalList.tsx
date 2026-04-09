import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getSubmittedTimeEntries, approveTimeEntries, rejectTimeEntry } from '../services/api/timeEntries';
import { exportTimeEntriesToCSV } from '../lib/csvExport';
import { Avatar } from './ui/Avatar';
import { Icon } from './ui/Icon';

export const TimeApprovalList: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [rejectionModal, setRejectionModal] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null,
    });
    const [rejectionReason, setRejectionReason] = useState('');

    const { data: entries, isLoading } = useQuery({
        queryKey: ['time-entries-submitted'],
        queryFn: getSubmittedTimeEntries,
    });

    const approveMutation = useMutation({
        mutationFn: approveTimeEntries,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['time-entries-submitted'] });
            queryClient.invalidateQueries({ queryKey: ['time-entries-stats'] });
            toast.success('Time entries approved successfully');
            setSelectedIds(new Set());
        },
        onError: (error: Error) => {
            toast.error(`Failed to approve entries: ${error.message}`);
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            rejectTimeEntry(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['time-entries-submitted'] });
            toast.info('Time entry rejected');
            setRejectionModal({ isOpen: false, id: null });
            setRejectionReason('');
        },
        onError: (error: Error) => {
            toast.error(`Failed to reject entry: ${error.message}`);
        },
    });

    const handleSelectAll = () => {
        if (entries && selectedIds.size === entries.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(entries?.map((e) => e.id)));
        }
    };

    const handleToggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkApprove = () => {
        if (selectedIds.size === 0) return;
        approveMutation.mutate(Array.from(selectedIds));
    };

    const handleSingleApprove = (id: string) => {
        approveMutation.mutate([id]);
    };

    const openRejectionModal = (id: string) => {
        setRejectionModal({ isOpen: true, id });
    };

    const handleRejectConfirm = () => {
        if (rejectionModal.id && rejectionReason.trim()) {
            rejectMutation.mutate({ id: rejectionModal.id, reason: rejectionReason });
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!entries || entries.length === 0) {
        return (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
                <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">All caught up!</h3>
                <p className="text-muted-foreground">No time entries pending approval.</p>
            </div>
        );
    }

    const allSelected = entries.length > 0 && selectedIds.size === entries.length;

    return (
        <div className="space-y-4">
            {/* Header Actions */}
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleSelectAll}
                        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {allSelected ? (
                            <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 mr-2 text-primary" /> // CheckCircle sort of
                        ) : (
                            <div className="w-5 h-5 mr-2 border-2 border-gray-500 rounded hover:border-white transition-colors" /> // Square manual
                        )}
                        <span className="text-sm font-medium">Select All ({entries.length})</span>
                    </button>
                    {selectedIds.size > 0 && (
                        <span className="text-sm text-primary font-medium">
                            {selectedIds.size} selected
                        </span>
                    )}
                </div>

            </div>

            <div className="flex space-x-2">
                <button
                    onClick={() => exportTimeEntriesToCSV(entries || [])}
                    className="flex items-center bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" className="w-4 h-4 mr-2" />
                    Export CSV
                </button>

                {selectedIds.size > 0 && (
                    <button
                        onClick={handleBulkApprove}
                        className="flex items-center bg-green-600 hover:bg-green-700 text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Icon path="M5 13l4 4L19 7" className="w-4 h-4 mr-2" />
                        Approve Selected
                    </button>
                )}
            </div>

            {/* List */}
            <div className="grid gap-3">
                {entries.map((entry) => (
                    <div
                        key={entry.id}
                        className={`bg-card p-4 rounded-lg border transition-all ${selectedIds.has(entry.id)
                            ? 'border-primary bg-muted/50'
                            : 'border-border hover:border-input'
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            {/* Checkbox */}
                            <div className="pt-1">
                                <button
                                    onClick={() => handleToggleSelect(entry.id)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    {selectedIds.has(entry.id) ? (
                                        <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 text-primary" />
                                    ) : (
                                        <div className="w-5 h-5 border-2 border-gray-500 rounded hover:border-white transition-colors" />
                                    )}
                                </button>
                            </div>

                            {/* Avatar & User */}
                            <div className="flex-shrink-0">
                                <Avatar
                                    avatarPath={entry.profile?.avatar_url}
                                    alt={entry.profile?.full_name || 'User'}
                                    size="md"
                                />
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* User & Project Info */}
                                <div>
                                    <h4 className="text-foreground font-medium truncate">
                                        {entry.profile?.full_name || 'Unknown User'}
                                    </h4>
                                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                                        <span className="truncate max-w-[150px]" title={entry.project?.title}>
                                            {entry.project?.title || 'No Project'}
                                        </span>
                                        {entry.task?.title && (
                                            <>
                                                <span className="mx-2">•</span>
                                                <span className="truncate max-w-[150px]" title={entry.task.title}>
                                                    {entry.task.title}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Date & Time */}
                                <div className="flex flex-col justify-center">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-4 h-4 mr-2 text-muted-foreground" />
                                        {new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(entry.start_time))}
                                    </div>
                                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                                        <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 mr-2 text-muted-foreground" />
                                        {new Intl.DateTimeFormat('de-DE', { timeStyle: 'short' }).format(new Date(entry.start_time))} -{' '}
                                        {entry.end_time ? new Intl.DateTimeFormat('de-DE', { timeStyle: 'short' }).format(new Date(entry.end_time)) : 'Active'}
                                        <span className="ml-2 font-medium text-primary">
                                            ({formatDuration(entry.duration_minutes || 0)})
                                        </span>
                                    </div>
                                </div>

                                {/* Description (Empty for now if no dedicated description field on entry, assuming Project/Task covers it) */}

                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2 pt-1 border-l border-border pl-4 ml-2">
                                <button
                                    onClick={() => handleSingleApprove(entry.id)}
                                    className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-full transition-colors"
                                    title="Approve"
                                >
                                    <Icon path="M5 13l4 4L19 7" className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => openRejectionModal(entry.id)}
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full transition-colors"
                                    title="Reject"
                                >
                                    <Icon path="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Rejection Modal */}
            {
                rejectionModal.isOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6 border border-border">
                            <h3 className="text-xl font-bold text-foreground mb-4">Reject Time Entry</h3>
                            <p className="text-muted-foreground mb-4 text-sm">
                                Please provide a reason for rejecting this time entry. The user will be notified.
                            </p>
                            <textarea
                                className="w-full bg-background border border-border rounded-lg p-3 text-foreground focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none h-32"
                                placeholder="Reason for rejection (e.g., Wrong project code, Excessive hours...)"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                autoFocus
                            />
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => {
                                        setRejectionModal({ isOpen: false, id: null });
                                        setRejectionReason('');
                                    }}
                                    className="px-4 py-2 text-muted-foreground hover:text-foreground font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRejectConfirm}
                                    disabled={!rejectionReason.trim() || rejectMutation.isPending}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-foreground rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {rejectMutation.isPending ? 'Rejecting...' : 'Reject Entry'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

// Helper for duration formatting
function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
}
