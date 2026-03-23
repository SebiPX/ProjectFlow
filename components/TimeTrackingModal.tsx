import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  getTimeEntriesByTask,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry
} from '../services/api/timeEntries';
import type { Task, TimeEntry } from '../types/supabase';
import { useAuth } from '../lib/AuthContext';
import { Icon } from './ui/Icon';

interface TimeTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
}

export const TimeTrackingModal: React.FC<TimeTrackingModalProps> = ({ isOpen, onClose, task }) => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeTimeEntryId, setActiveTimeEntryId] = useState<string | null>(null);

  // Manual entry state
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualFormData, setManualFormData] = useState({
    start_time: '',
    end_time: '',
    duration_minutes: '',
    billable: true,
  });

  // Edit state
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

  // Fetch time entries for this task
  const { data: timeEntries = [], isLoading } = useQuery({
    queryKey: ['timeEntries', task.id],
    queryFn: () => getTimeEntriesByTask(task.id),
    enabled: isOpen,
  });

  // Create time entry mutation
  const createMutation = useMutation({
    mutationFn: createTimeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['task-variance', task.id] });
      queryClient.invalidateQueries({ queryKey: ['project-service-breakdown', task.project_id] });
      toast.success('Time entry created!');
    },
    onError: (error: any) => {
      toast.error(`Failed to create time entry: ${error.message}`);
    },
  });

  // Update time entry mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TimeEntry> }) =>
      updateTimeEntry(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['task-variance', task.id] });
      queryClient.invalidateQueries({ queryKey: ['project-service-breakdown', task.project_id] });
      toast.success('Time entry updated!');
      setEditingEntry(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to update time entry: ${error.message}`);
    },
  });

  // Delete time entry mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTimeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries', task.id] });
      queryClient.invalidateQueries({ queryKey: ['task-variance', task.id] });
      queryClient.invalidateQueries({ queryKey: ['project-service-breakdown', task.project_id] });
      toast.success('Time entry deleted!');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete time entry: ${error.message}`);
    },
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTimerRunning && timerStart) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - timerStart.getTime()) / 1000);
        setElapsedSeconds(diff);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerStart]);

  // Check for running timer on mount
  useEffect(() => {
    if (!isOpen || !profile) return;

    // Look for an existing draft entry for this task and user
    const runningEntry = timeEntries.find(
      (entry) => entry.status === 'draft' && entry.profile_id === profile.id && !entry.end_time
    );

    if (runningEntry) {
      // Restore timer state
      const startTime = new Date(runningEntry.start_time);
      setTimerStart(startTime);
      setIsTimerRunning(true);
      setActiveTimeEntryId(runningEntry.id);

      // Calculate elapsed time
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsedSeconds(diff);
    }
  }, [isOpen, timeEntries, profile]);

  // Start timer
  const handleStartTimer = async () => {
    if (!user || !profile) {
      toast.error('You must be logged in to track time');
      return;
    }

    // Check if there's already a running timer
    const existingDraft = timeEntries.find(
      (entry) => entry.status === 'draft' && entry.profile_id === profile.id && !entry.end_time
    );

    if (existingDraft) {
      toast.warning('There is already a timer running for this task');
      return;
    }

    const now = new Date();
    setTimerStart(now);
    setIsTimerRunning(true);
    setElapsedSeconds(0);

    // Create a draft time entry
    try {
      const newEntry = await createMutation.mutateAsync({
        project_id: task.project_id,
        task_id: task.id,
        profile_id: profile.id,
        start_time: now.toISOString(),
        end_time: null,
        duration_minutes: null,
        status: 'draft',
        billable: true,
      });
      setActiveTimeEntryId(newEntry.id);
    } catch (error) {
      setIsTimerRunning(false);
      setTimerStart(null);
    }
  };

  // Stop timer
  const handleStopTimer = async () => {
    if (!activeTimeEntryId || !timerStart) return;

    const now = new Date();
    const durationMinutes = Math.round((now.getTime() - timerStart.getTime()) / 60000);

    setIsTimerRunning(false);

    // Update the time entry with end time and duration
    try {
      await updateMutation.mutateAsync({
        id: activeTimeEntryId,
        updates: {
          end_time: now.toISOString(),
          duration_minutes: durationMinutes,
          status: 'submitted',
        },
      });
      setActiveTimeEntryId(null);
      setTimerStart(null);
      setElapsedSeconds(0);
    } catch (error) {
      setIsTimerRunning(true);
    }
  };

  // Handle manual entry submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) {
      toast.error('You must be logged in to track time');
      return;
    }

    const startTime = new Date(manualFormData.start_time);
    const endTime = new Date(manualFormData.end_time);
    const durationMinutes = manualFormData.duration_minutes
      ? parseInt(manualFormData.duration_minutes)
      : Math.round((endTime.getTime() - startTime.getTime()) / 60000);

    await createMutation.mutateAsync({
      project_id: task.project_id,
      task_id: task.id,
      profile_id: profile.id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
      status: 'submitted',
      billable: manualFormData.billable,
    });

    setManualFormData({
      start_time: '',
      end_time: '',
      duration_minutes: '',
      billable: true,
    });
    setShowManualEntry(false);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this time entry?')) {
      await deleteMutation.mutate(id);
    }
  };

  // Calculate total time
  const totalMinutes = timeEntries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  // Format elapsed time
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Time Tracking</h2>
            <p className="text-muted-foreground text-sm mt-1">{task.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Timer Section */}
          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Timer</h3>
            <div className="flex items-center justify-between">
              <div className="text-4xl font-mono text-primary">
                {formatTime(elapsedSeconds)}
              </div>
              <div className="flex gap-3">
                {!isTimerRunning ? (
                  <button
                    onClick={handleStartTimer}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-foreground rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Icon path="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5" />
                    Start
                  </button>
                ) : (
                  <button
                    onClick={handleStopTimer}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-foreground rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Icon path="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5" />
                    Stop
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Manual Entry Toggle */}
          <div>
            <button
              onClick={() => setShowManualEntry(!showManualEntry)}
              className="text-primary hover:text-blue-300 flex items-center gap-2"
            >
              <Icon path="M12 6v6m0 0v6m0-6h6m-6 0H6" className="w-5 h-5" />
              {showManualEntry ? 'Hide Manual Entry' : 'Add Manual Entry'}
            </button>
          </div>

          {/* Manual Entry Form */}
          {showManualEntry && (
            <form onSubmit={handleManualSubmit} className="bg-muted/50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">Manual Time Entry</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={manualFormData.start_time}
                    onChange={(e) => setManualFormData({ ...manualFormData, start_time: e.target.value })}
                    className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={manualFormData.end_time}
                    onChange={(e) => setManualFormData({ ...manualFormData, end_time: e.target.value })}
                    className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Duration (minutes) - Optional
                </label>
                <input
                  type="number"
                  min="1"
                  value={manualFormData.duration_minutes}
                  onChange={(e) => setManualFormData({ ...manualFormData, duration_minutes: e.target.value })}
                  className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Auto-calculated if not provided"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="billable"
                  checked={manualFormData.billable}
                  onChange={(e) => setManualFormData({ ...manualFormData, billable: e.target.checked })}
                  className="w-4 h-4 bg-muted border-input rounded focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="billable" className="ml-2 text-sm text-muted-foreground">
                  Billable
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowManualEntry(false)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
                >
                  Add Entry
                </button>
              </div>
            </form>
          )}

          {/* Total Time */}
          <div className="bg-primary/20 border border-blue-600/50 rounded-lg p-4 text-primary-foreground">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Time Tracked:</span>
              <span className="text-2xl font-bold text-primary">
                {totalHours}h {remainingMinutes}m
              </span>
            </div>
          </div>

          {/* Time Entries List */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Time Entries</h3>
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading...</div>
            ) : timeEntries.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No time entries yet. Start tracking time!
              </div>
            ) : (
              <div className="space-y-3">
                {timeEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-muted/50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-foreground font-medium">
                          {entry.profile?.full_name || entry.profile?.email || 'Unknown'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          entry.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          entry.status === 'submitted' ? 'bg-primary/20 text-primary' :
                          entry.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-primary-foreground'
                        }`}>
                          {entry.status}
                        </span>
                        {entry.billable && (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
                            Billable
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(entry.start_time).toLocaleString('de-DE')}
                        {entry.end_time && ` - ${new Date(entry.end_time).toLocaleString('de-DE')}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xl font-bold text-primary">
                        {entry.duration_minutes ? `${Math.floor(entry.duration_minutes / 60)}h ${entry.duration_minutes % 60}m` : 'Running...'}
                      </span>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-muted/80 rounded transition-colors"
                        title="Delete entry"
                      >
                        <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
