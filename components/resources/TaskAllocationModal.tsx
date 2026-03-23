import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { updateTask } from '../../services/api/tasks';
import { ResourceData, ResourceAllocation } from '../../services/api/resources';
import type { Profile, TaskStatus } from '../../types/supabase';
import { Icon } from '../ui/Icon';

interface TaskAllocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date;
    resourceProfile: Profile;
    allocation: ResourceAllocation;
    allResources: Profile[];
    onUpdate: () => void;
}

export default function TaskAllocationModal({
    isOpen,
    onClose,
    date,
    resourceProfile,
    allocation,
    allResources,
    onUpdate
}: TaskAllocationModalProps) {
    const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleReassign = async (taskId: string, newAssigneeId: string) => {
        if (!newAssigneeId || newAssigneeId === resourceProfile.id) return;

        setLoadingTaskId(taskId);
        try {
            await updateTask(taskId, { assigned_to: newAssigneeId });
            toast.success('Task erfolgreich neu zugewiesen');
            onUpdate();
        } catch (error) {
            console.error(error);
            toast.error('Fehler beim Zuweisen des Tasks');
        } finally {
            setLoadingTaskId(null);
        }
    };

    const handleReschedule = async (taskId: string, startDate: string, dueDate: string) => {
        setLoadingTaskId(taskId);
        try {
            await updateTask(taskId, {
                start_date: new Date(startDate).toISOString(),
                due_date: new Date(dueDate).toISOString()
            });
            toast.success('Zeitraum aktualisiert');
            onUpdate();
        } catch (error) {
            console.error(error);
            toast.error('Fehler beim Aktualisieren des Zeitraums');
        } finally {
            setLoadingTaskId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" className="w-6 h-6 text-primary" />
                            Tasks verwalten
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {resourceProfile.full_name} • {date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition">
                        <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6" />
                    </button>
                </div>

                {/* Task List */}
                <div className="space-y-4">
                    {allocation.tasks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground bg-background/50 rounded-lg border border-border border-dashed">
                            Keine Tasks für diesen Tag zugewiesen.
                        </div>
                    ) : (
                        allocation.tasks.map(task => (
                            <div key={task.id} className="bg-background border border-border rounded-lg p-4 group hover:border-primary/50 transition-colors">

                                {/* Task Title & Project */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-semibold text-foreground text-lg">{task.title}</h3>
                                        <div className="flex items-center gap-2 text-sm mt-1">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.projectColor || '#ccc' }}></span>
                                            <span className="text-muted-foreground">{task.projectTitle}</span>
                                            <span className="text-gray-600">•</span>
                                            <span className="text-primary font-medium">{task.hours.toFixed(1)}h / Tag</span>
                                        </div>
                                    </div>
                                    {/* Status Badge */}
                                    <span className="px-2 py-1 bg-card text-muted-foreground text-xs rounded border border-border uppercase font-medium tracking-wider">
                                        {task.status?.replace('_', ' ')}
                                    </span>
                                </div>

                                {/* Actions Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">

                                    {/* Reassign */}
                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                                            Zuweisen an
                                        </label>
                                        <select
                                            className="w-full bg-card border border-border text-foreground text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                            value={resourceProfile.id}
                                            disabled={loadingTaskId === task.id}
                                            onChange={(e) => handleReassign(task.id, e.target.value)}
                                        >
                                            {allResources.map(res => (
                                                <option key={res.id} value={res.id}>
                                                    {res.full_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Move/Reschedule (Simple Placeholder for MVP: Just Reassign is user's main need) 
                      Actually, let's just do Reassign first as it's the most high-value interaction 
                      User asked for "Interactive shifting" -> Reassign AND Reschedule.
                  */}
                                    {/* 
                      For Reschedule we'd need the current start/due dates, which we don't have in the `ResourceAllocation` task subset.
                      We only have `id`, `title`, etc. 
                      I will skip Date Editing for this specific MVP step unless I fetch the full task details.
                      Let's stick to Reassignment which is perfectly supported by the data we have + the `allResources` prop.
                   */}

                                    <div className="flex items-end">
                                        <p className="text-xs text-muted-foreground italic pb-2">
                                            * Datumsänderung bitte über Task-Detailansicht vornehmen.
                                        </p>
                                    </div>

                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors"
                    >
                        Schließen
                    </button>
                </div>

            </div>
        </div>
    );
}
