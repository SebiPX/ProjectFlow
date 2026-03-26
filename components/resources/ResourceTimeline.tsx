import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { ResourceData, ResourceAllocation } from '../../services/api/resources';
import TaskAllocationModal from './TaskAllocationModal';

interface ResourceTimelineProps {
    resources: ResourceData[];
    startDate: Date;
    onDateChange: (date: Date) => void;
    isLoading: boolean;
    onDataUpdate?: () => void;
}

const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
};

const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
};

export default function ResourceTimeline({ resources, startDate, onDateChange, isLoading, onDataUpdate }: ResourceTimelineProps) {
    const DAYS_TO_SHOW = 14;
    const [selectedCell, setSelectedCell] = useState<{
        date: Date;
        resource: ResourceData;
        allocation: ResourceAllocation;
    } | null>(null);

    // Generate dates for the header
    const dates = Array.from({ length: DAYS_TO_SHOW }, (_, i) => addDays(startDate, i));

    const getUtilizationColor = (allocation: ResourceAllocation | undefined, capacity: number) => {
        if (allocation?.absences?.length) {
            return 'bg-secondary/40 text-secondary-foreground border-border hover:bg-secondary/60';
        }
        if (!allocation || allocation.hours === 0) return 'bg-muted/30 border-border text-muted-foreground'; // Empty state
        const utilization = (allocation.hours / capacity) * 100;

        if (utilization > 100) return 'bg-destructive/20 text-destructive border-transparent hover:bg-destructive/30';
        if (utilization >= 80) return 'bg-orange-500/20 text-orange-600 border-transparent hover:bg-orange-500/30';
        return 'bg-emerald-500/20 text-emerald-600 border-transparent hover:bg-emerald-500/30';
    };

    const formatHours = (hours: number) => {
        return Number.isInteger(hours) ? hours : hours.toFixed(1);
    };

    const allProfiles = resources.map(r => r.profile);

    return (
        <>
            <Card className="overflow-hidden">
                {/* Controls */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                    <h3 className="text-lg font-semibold text-foreground">Kapazitätsplanung</h3>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => onDateChange(addDays(startDate, -7))}
                            className="p-1 rounded-full hover:bg-muted transition"
                        >
                            <Icon path="M15 19l-7-7 7-7" className="w-5 h-5 text-muted-foreground" />
                        </button>
                        <span className="text-sm font-medium text-foreground">
                            {startDate.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <button
                            onClick={() => onDateChange(addDays(startDate, 7))}
                            className="p-1 rounded-full hover:bg-muted transition"
                        >
                            <Icon path="M9 5l7 7-7 7" className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>
                </div>

                {/* Timeline Grid */}
                <div className="overflow-x-auto overflow-y-auto max-h-[70vh] relative">
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-30">
                            <tr>
                                <th className="p-3 text-left bg-card border-b border-r border-border min-w-[200px] sticky left-0 z-40 w-64 text-muted-foreground shadow-md outline outline-1 outline-border">
                                    Mitarbeiter
                                </th>
                                {dates.map(date => {
                                    const weekend = isWeekend(date);
                                    return (
                                        <th
                                            key={date.toISOString()}
                                            className={`p-2 text-center border-b border-border min-w-[60px] outline outline-1 outline-border outline-offset-[-1px] ${weekend ? 'bg-muted text-muted-foreground' : 'bg-card text-foreground'}`}
                                        >
                                            <div className="text-xs font-medium uppercase opacity-70">
                                                {date.toLocaleDateString('de-DE', { weekday: 'short' })}
                                            </div>
                                            <div className={`text-sm font-bold ${isSameDay(date, new Date()) ? 'text-primary' : ''}`}>
                                                {date.getDate()}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-background">
                            {isLoading ? (
                                // Skeletons
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-3 border-r border-border sticky left-0 bg-muted/10">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                                                <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                                            </div>
                                        </td>
                                        {dates.map(d => (
                                            <td key={d.toISOString()} className="p-2 border-b border-border bg-muted/5"></td>
                                        ))}
                                    </tr>
                                ))
                            ) : resources.map(resource => (
                                <tr key={resource.profile.id} className="hover:bg-muted/50 transition-colors">
                                    {/* Employee Info */}
                                    <td className="p-3 border-r border-border sticky left-0 bg-background z-10 w-64 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0">
                                                <Avatar
                                                    src={resource.profile.avatar_url}
                                                    alt={resource.profile.full_name || 'User'}
                                                    size="sm"
                                                />
                                            </div>
                                            <div className="truncate">
                                                <div className="font-medium text-foreground text-sm truncate">
                                                    {resource.profile.full_name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {resource.capacityPerDay}h / Tag
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Capacity Cells */}
                                    {dates.map(date => {
                                        const dateKey = date.toISOString().split('T')[0];
                                        const allocation = resource.allocations[dateKey];
                                        const weekend = isWeekend(date);

                                        if (weekend) {
                                            return <td key={dateKey} className="bg-muted/20 border-r border-border"></td>;
                                        }

                                        const colorClass = getUtilizationColor(allocation, resource.capacityPerDay);

                                        return (
                                            <td key={dateKey} className="p-1 border-r border-border relative group">
                                                <button
                                                    onClick={() => {
                                                        if (allocation && allocation.tasks?.length > 0) {
                                                            setSelectedCell({ date, resource, allocation });
                                                        }
                                                    }}
                                                    className={`w-full h-10 rounded flex items-center justify-center text-xs font-medium border transition-all duration-200 ${colorClass} ${allocation && (allocation.tasks?.length > 0 || allocation.absences?.length) ? 'cursor-pointer transform hover:scale-105 shadow-sm' : 'cursor-default opacity-50'}`}
                                                >
                                                    {allocation?.absences?.length ? 'Abwesend' : (allocation && allocation.hours > 0 ? `${formatHours(allocation.hours)}h` : '-')}
                                                </button>

                                                {/* Tooltip */}
                                                {allocation?.absences?.length ? (
                                                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-purple-800 text-foreground text-xs rounded pointer-events-none whitespace-nowrap">
                                                        {allocation.absences.map((a, i) => <span key={i}>{a.reason}</span>)}
                                                    </div>
                                                ) : (allocation && allocation.tasks?.length > 0 && (
                                                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-foreground text-xs rounded pointer-events-none whitespace-nowrap">
                                                        {allocation.tasks.length} {allocation.tasks.length === 1 ? 'Task' : 'Tasks'} • Klicken zum Bearbeiten
                                                    </div>
                                                ))}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Allocation Modal */}
            {selectedCell && (
                <TaskAllocationModal
                    isOpen={!!selectedCell}
                    onClose={() => setSelectedCell(null)}
                    date={selectedCell.date}
                    resourceProfile={selectedCell.resource.profile}
                    allocation={selectedCell.allocation}
                    allResources={allProfiles}
                    onUpdate={() => {
                        setSelectedCell(null); // Close modal on update
                        if (onDataUpdate) onDataUpdate(); // Trigger refetch
                    }}
                />
            )}
        </>
    );
}
