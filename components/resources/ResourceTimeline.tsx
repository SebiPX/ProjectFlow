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
            return 'bg-purple-900/40 text-purple-300 border-purple-700 hover:bg-purple-800/60';
        }
        if (!allocation || allocation.hours === 0) return 'bg-gray-800 border-gray-700 text-gray-500'; // Empty state
        const utilization = (allocation.hours / capacity) * 100;

        if (utilization > 100) return 'bg-red-900/50 text-red-200 border-red-800 hover:bg-red-900/70';
        if (utilization >= 80) return 'bg-yellow-900/50 text-yellow-200 border-yellow-800 hover:bg-yellow-900/70';
        return 'bg-green-900/50 text-green-200 border-green-800 hover:bg-green-900/70';
    };

    const formatHours = (hours: number) => {
        return Number.isInteger(hours) ? hours : hours.toFixed(1);
    };

    const allProfiles = resources.map(r => r.profile);

    return (
        <>
            <Card className="overflow-hidden">
                {/* Controls */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
                    <h3 className="text-lg font-semibold text-white">Kapazitätsplanung</h3>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => onDateChange(addDays(startDate, -7))}
                            className="p-1 rounded-full hover:bg-gray-700 transition"
                        >
                            <Icon path="M15 19l-7-7 7-7" className="w-5 h-5 text-gray-400" />
                        </button>
                        <span className="text-sm font-medium text-gray-300">
                            {startDate.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <button
                            onClick={() => onDateChange(addDays(startDate, 7))}
                            className="p-1 rounded-full hover:bg-gray-700 transition"
                        >
                            <Icon path="M9 5l7 7-7 7" className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Timeline Grid */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="p-3 text-left bg-gray-800 border-b border-r border-gray-700 min-w-[200px] sticky left-0 z-10 w-64 text-gray-300 shadow-md">
                                    Mitarbeiter
                                </th>
                                {dates.map(date => {
                                    const weekend = isWeekend(date);
                                    return (
                                        <th
                                            key={date.toISOString()}
                                            className={`p-2 text-center border-b border-gray-700 min-w-[60px] ${weekend ? 'bg-gray-800/50 text-gray-600' : 'bg-gray-800 text-gray-300'}`}
                                        >
                                            <div className="text-xs font-medium uppercase opacity-70">
                                                {date.toLocaleDateString('de-DE', { weekday: 'short' })}
                                            </div>
                                            <div className={`text-sm font-bold ${isSameDay(date, new Date()) ? 'text-blue-500' : ''}`}>
                                                {date.getDate()}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 bg-gray-900">
                            {isLoading ? (
                                // Skeletons
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-3 border-r border-gray-700 sticky left-0 bg-gray-800">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
                                                <div className="h-4 bg-gray-700 rounded w-32 animate-pulse"></div>
                                            </div>
                                        </td>
                                        {dates.map(d => (
                                            <td key={d.toISOString()} className="p-2 border-b border-gray-700 bg-gray-800/20"></td>
                                        ))}
                                    </tr>
                                ))
                            ) : resources.map(resource => (
                                <tr key={resource.profile.id} className="hover:bg-gray-800/30 transition-colors">
                                    {/* Employee Info */}
                                    <td className="p-3 border-r border-gray-700 sticky left-0 bg-gray-900 z-10 w-64 shadow-md">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0">
                                                <Avatar
                                                    src={resource.profile.avatar_url}
                                                    alt={resource.profile.full_name || 'User'}
                                                    size="sm"
                                                />
                                            </div>
                                            <div className="truncate">
                                                <div className="font-medium text-gray-200 text-sm truncate">
                                                    {resource.profile.full_name}
                                                </div>
                                                <div className="text-xs text-gray-500">
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
                                            return <td key={dateKey} className="bg-gray-900/50 border-r border-gray-800"></td>;
                                        }

                                        const colorClass = getUtilizationColor(allocation, resource.capacityPerDay);

                                        return (
                                            <td key={dateKey} className="p-1 border-r border-gray-800 relative group">
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
                                                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-purple-800 text-white text-xs rounded pointer-events-none whitespace-nowrap">
                                                        {allocation.absences.map((a, i) => <span key={i}>{a.reason}</span>)}
                                                    </div>
                                                ) : (allocation && allocation.tasks?.length > 0 && (
                                                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded pointer-events-none whitespace-nowrap">
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
