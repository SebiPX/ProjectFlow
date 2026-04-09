import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTasks } from '../../services/api/tasks';
import { getProjects } from '../../services/api/projects';
import { getProfiles } from '../../services/api/profiles';
import { Icon } from '../ui/Icon';
import { addDays, formatDate, isSameDay } from '../../lib/dateUtils';
import { TaskEditModal } from '../TaskEditModal';
import type { Task, Project } from '../../types/supabase';

export const GanttView: React.FC = () => {
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
    const [startDate, setStartDate] = useState(new Date());
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // Fetch Data
    const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: getTasks });
    const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: getProjects });
    const { data: profiles = [] } = useQuery({ queryKey: ['profiles-all'], queryFn: getProfiles });

    // Constants
    const CELL_WIDTH = 50;
    const DAYS_TO_SHOW = 30;

    // Generate Timeline Header
    const timelineDays = useMemo(() => {
        const days = [];
        // Start slightly before
        const start = addDays(startDate, -2);
        for (let i = 0; i < DAYS_TO_SHOW; i++) {
            days.push(addDays(start, i));
        }
        return days;
    }, [startDate]);

    // Group Tasks by Project
    const groupedTasks = useMemo(() => {
        const grouped: Record<string, Task[]> = {};
        projects.forEach(p => grouped[p.id] = []);

        tasks.forEach(task => {
            if (grouped[task.project_id]) {
                grouped[task.project_id].push(task);
            }
        });

        return projects.map(p => ({
            project: p,
            tasks: grouped[p.id] || []
        })).filter(g => g.tasks.length > 0); // Only show projects with tasks or always show? Let's show active.
    }, [projects, tasks]);

    // Handle Scroll (Basic prev/next)
    const shiftTime = (days: number) => {
        setStartDate(prev => addDays(prev, days));
    };

    // Calculate Bar Position
    const getBarStyles = (task: Task, timelineStart: Date) => {
        // Determine true start and end dates from all available milestones
        const dates = [
            task.start_date, 
            task.review_date, 
            task.revision_date, 
            task.due_date
        ].filter(Boolean).map(d => new Date(d!));

        let tStart: Date, tEnd: Date;
        if (dates.length > 0) {
            tStart = new Date(Math.min(...dates.map(d => d.getTime())));
            tEnd = new Date(Math.max(...dates.map(d => d.getTime())));
            // If min and max are the same, make it 1 day long
            if (tStart.getTime() === tEnd.getTime()) {
                tEnd = addDays(tStart, 1);
            }
        } else {
            tStart = new Date(task.created_at || new Date());
            tEnd = addDays(tStart, 1);
        }

        // Normalize to timeline start (0 position)
        const offsetMs = tStart.getTime() - timelineStart.getTime();
        const durationMs = tEnd.getTime() - tStart.getTime();

        const msPerDay = 1000 * 60 * 60 * 24;

        const left = (offsetMs / msPerDay) * CELL_WIDTH;
        const width = Math.max((durationMs / msPerDay) * CELL_WIDTH, CELL_WIDTH); // Min 1 cell (display width)

        return {
            left: `${left}px`,
            width: `${width}px`,
        };
    };

    return (
        <div className="bg-card rounded-xl overflow-hidden shadow-lg border border-border flex flex-col h-full">
            {/* Controls */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card">
                <div className="flex items-center gap-2">
                    <button onClick={() => shiftTime(-7)} className="p-2 hover:bg-muted rounded text-muted-foreground">
                        <Icon path="M15 19l-7-7 7-7" className="w-5 h-5" />
                    </button>
                    <span className="text-foreground font-medium">
                        {formatDate(timelineDays[0])} - {formatDate(timelineDays[timelineDays.length - 1])}
                    </span>
                    <button onClick={() => shiftTime(7)} className="p-2 hover:bg-muted rounded text-muted-foreground">
                        <Icon path="M9 5l7 7-7 7" className="w-5 h-5" />
                    </button>
                </div>
                <button onClick={() => setStartDate(new Date())} className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary hover:text-primary-foreground">
                    Jump to Today
                </button>
            </div>

            {/* Timeline Area */}
            <div className="flex-1 overflow-auto relative flex">
                {/* Sidebar (Project Names) - Fixed Left */}
                <div className="w-64 flex-shrink-0 bg-card border-r border-border z-10 sticky left-0 shadow-xl">
                    <div className="h-10 border-b border-border bg-background/50 flex items-center px-4 font-semibold text-muted-foreground text-sm">
                        Projects / Tasks
                    </div>
                    {groupedTasks.map(group => (
                        <div key={group.project.id}>
                            {/* Project Row */}
                            <div className="h-10 px-4 flex items-center bg-card border-b border-border/50 font-bold text-foreground truncate sticky top-0">
                                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: group.project.color_code || '#777' }} />
                                {group.project.title}
                            </div>
                            {/* Task Rows */}
                            {group.tasks.map(task => (
                                <div 
                                    key={task.id} 
                                    onClick={() => setEditingTask(task)}
                                    className="h-8 px-8 flex items-center text-sm text-muted-foreground border-b border-border/30 truncate hover:bg-muted/50 cursor-pointer transition-colors"
                                    title="Edit Task"
                                >
                                    {task.title}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Scrollable Timeline Grid */}
                <div className="flex-1 overflow-x-auto">
                    <div className="relative min-w-full" style={{ width: `${timelineDays.length * CELL_WIDTH}px` }}> {/* Explicit width container */}

                        {/* Header Dates */}
                        <div className="flex h-10 border-b border-border bg-background/50">
                            {timelineDays.map(day => (
                                <div
                                    key={day.toISOString()}
                                    className={`flex-shrink-0 border-r border-border flex flex-col items-center justify-center text-xs ${isSameDay(day, new Date()) ? 'bg-blue-900/30 text-primary' : 'text-muted-foreground'}`}
                                    style={{ width: CELL_WIDTH }}
                                >
                                    <span className="font-bold">{day.getDate()}</span>
                                    <span className="text-[10px] uppercase">{day.toLocaleDateString('de-DE', { weekday: 'short' }).slice(0, 2)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Grid Line Background */}
                        <div className="absolute top-10 bottom-0 left-0 right-0 flex pointer-events-none">
                            {timelineDays.map(day => (
                                <div
                                    key={`grid-${day.toISOString()}`}
                                    className="flex-shrink-0 border-r border-border/20 h-full"
                                    style={{ width: CELL_WIDTH, backgroundColor: isSameDay(day, new Date()) ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}
                                />
                            ))}
                        </div>

                        {/* Bars */}
                        <div className="relative pt-0">
                            {groupedTasks.map(group => (
                                <div key={`bars-${group.project.id}`}>
                                    {/* Project Row Spacer */}
                                    <div className="h-10" />

                                    {/* Task Bars */}
                                    {group.tasks.map(task => {
                                        // Logic to check if task is within visible range to optimize rendering?
                                        // For now, render all, position absolute relative to timeline start
                                        const barStyle = getBarStyles(task, timelineDays[0]);

                                        return (
                                            <div key={`bar-${task.id}`} className="h-8 relative w-full border-b border-border/30 group">
                                                <div
                                                    onClick={() => setEditingTask(task)}
                                                    className="absolute h-5 top-1.5 rounded-full text-[10px] px-2 flex items-center text-foreground overflow-hidden whitespace-nowrap shadow-sm cursor-pointer group-hover:opacity-100 transition-opacity"
                                                    style={{
                                                        ...barStyle,
                                                        backgroundColor: group.project.color_code || '#3B82F6',
                                                        opacity: 0.85
                                                    }}
                                                    title={`Edit ${task.title}`}
                                                >
                                                    {/* Only show title inside bar if wide enough? */}
                                                    <span className="drop-shadow-md">{task.title}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Task Modal */}
            {editingTask && (
                <TaskEditModal
                    isOpen={!!editingTask}
                    onClose={() => setEditingTask(null)}
                    task={editingTask}
                />
            )}
        </div>
    );
};
