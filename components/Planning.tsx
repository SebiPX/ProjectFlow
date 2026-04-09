import React, { useState } from 'react';
import { CalendarView } from './planning/CalendarView';
import { GanttView } from './planning/GanttView';
import { Icon } from './ui/Icon';

export const Planning: React.FC = () => {
    const [activeView, setActiveView] = useState<'calendar' | 'gantt'>('calendar');

    return (
        <div className="h-full flex flex-col p-6 md:p-8 overflow-hidden">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Planning</h1>
                    <p className="text-muted-foreground mt-1">Visualize tasks and deadlines</p>
                </div>

                {/* View Toggle */}
                <div className="flex bg-card rounded-lg p-1 border border-border">
                    <button
                        onClick={() => setActiveView('calendar')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${activeView === 'calendar'
                                ? 'bg-primary text-primary-foreground shadow-lg'
                                : 'text-muted-foreground hover:text-primary-foreground hover:bg-muted'
                            }`}
                    >
                        <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-4 h-4" />
                        <span>Calendar</span>
                    </button>

                    <button
                        onClick={() => setActiveView('gantt')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${activeView === 'gantt'
                                ? 'bg-primary text-primary-foreground shadow-lg'
                                : 'text-muted-foreground hover:text-primary-foreground hover:bg-muted'
                            }`}
                    >
                        <Icon path="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" className="w-4 h-4" />
                        <span>Timeline</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden rounded-xl">
                {activeView === 'calendar' ? <CalendarView /> : <GanttView />}
            </div>
        </div>
    );
};
