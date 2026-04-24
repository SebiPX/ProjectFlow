import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTasks } from '../../services/api/tasks';
import { getProjects } from '../../services/api/projects';
import { Icon } from '../ui/Icon';
import { getDaysInMonth, getFirstDayOfMonth, addDays, isSameDay, getMonthName } from '../../lib/dateUtils';
import { TaskEditModal } from '../TaskEditModal';
import type { Task, Project } from '../../types/supabase';

export const CalendarView: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // Fetch Data
    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks'],
        queryFn: getTasks
    });

    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: getProjects
    });

    // Navigation
    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Grid Generation
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate); // 0 (Mon) to 6 (Sun)
    const totalSlots = daysInMonth + firstDay;
    const days = [];

    const activeProjectIds = new Set(projects.filter(p => p.status === 'active').map(p => p.id));
    const activeTasks = tasks.filter(t => activeProjectIds.has(t.project_id));

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }

    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }

    // Helper to get Project Color
    const getProjectColor = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        return project?.color_code || '#3B82F6';
    };

    // Weekday Headers (German)
    const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    return (
        <div className="bg-card rounded-xl overflow-hidden shadow-lg border border-border flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-foreground uppercase tracking-wide">
                        {getMonthName(currentDate)}
                    </h2>
                    <div className="flex bg-muted rounded-lg p-1">
                        <button onClick={prevMonth} className="p-1 hover:bg-muted/80 rounded text-muted-foreground">
                            <Icon path="M15 19l-7-7 7-7" className="w-5 h-5" />
                        </button>
                        <button onClick={goToToday} className="px-3 py-1 text-sm font-medium text-foreground hover:bg-muted/80 rounded">
                            Today
                        </button>
                        <button onClick={nextMonth} className="p-1 hover:bg-muted/80 rounded text-muted-foreground">
                            <Icon path="M9 5l7 7-7 7" className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 min-h-0 flex flex-col overflow-x-auto">
                <div className="min-w-[1000px] flex flex-col h-full">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-border bg-card/50">
                        {weekdays.map(day => (
                            <div key={day} className="py-2 text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-7 auto-rows-[minmax(120px,1fr)] min-h-full">
                            {days.map((date, index) => {
                            if (!date) {
                                return <div key={`empty-${index}`} className="bg-background/40 border-r border-b border-border" />;
                            }

                            const dayTasks = activeTasks.filter(task => {
                                const dates = [
                                    task.start_date, 
                                    task.review_date, 
                                    task.revision_date, 
                                    task.due_date
                                ].filter(Boolean).map(d => new Date(d!));
                                
                                if (dates.length === 0) return false;
                                
                                const start = new Date(Math.min(...dates.map(d => d.getTime())));
                                const end = new Date(Math.max(...dates.map(d => d.getTime())));
                                
                                // Strip time to ensure day-level comparison is accurate
                                start.setHours(0, 0, 0, 0);
                                end.setHours(23, 59, 59, 999);
                                
                                const current = new Date(date);
                                current.setHours(12, 0, 0, 0);

                                return current >= start && current <= end;
                            });

                            // Is Today?
                            const isToday = isSameDay(date, new Date());

                            return (
                                <div
                                    key={date.toISOString()}
                                    className={`border-r border-b border-border p-2 min-h-[100px] relative transition-colors hover:bg-card/80 ${isToday ? 'bg-blue-900/20' : ''}`}
                                >
                                    <div className={`text-sm font-medium mb-2 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                                        {date.getDate()}
                                    </div>

                                    <div className="space-y-1 overflow-y-auto max-h-[100px]">
                                        {dayTasks.map(task => {
                                            const isReview = task.review_date && isSameDay(date, new Date(task.review_date));
                                            const isRevision = task.revision_date && isSameDay(date, new Date(task.revision_date));
                                            const isDue = task.due_date && isSameDay(date, new Date(task.due_date));
                                            
                                            let prefix = '';
                                            if (isDue) prefix = '🏁 ';
                                            else if (isReview) prefix = '🎯 ';
                                            else if (isRevision) prefix = '✍️ ';

                                            const timeStr = isDue && task.due_date ? 
                                                new Date(task.due_date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr - ' : '';

                                            return (
                                                <div
                                                    key={task.id}
                                                    onClick={() => setEditingTask(task)}
                                                    className={`text-xs px-2 py-1 rounded truncate border-l-2 text-foreground/90 cursor-pointer hover:opacity-80 transition-opacity ${prefix ? 'font-bold' : ''}`}
                                                    style={{
                                                        backgroundColor: `${getProjectColor(task.project_id)}20`, // 20% opacity
                                                        borderColor: getProjectColor(task.project_id)
                                                    }}
                                                    title={task.title}
                                                >
                                                    {prefix}{timeStr}{task.title}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
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
