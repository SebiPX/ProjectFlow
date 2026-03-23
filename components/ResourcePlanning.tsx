import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getResourceAvailability } from '../services/api/resources';
import ResourceTimeline from './resources/ResourceTimeline';
import { Icon } from '../components/ui/Icon';

const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    d.setDate(diff);
    return d;
};

const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export default function ResourcePlanning() {
    const [startDate, setStartDate] = useState(getStartOfWeek(new Date()));
    const endDate = addDays(startDate, 14); // Fetch 2 weeks at a time

    const { data: resources = [], isLoading, refetch } = useQuery({
        queryKey: ['resources', startDate.toISOString()],
        queryFn: () => getResourceAvailability(startDate, endDate),
        staleTime: 5 * 60 * 1000,
    });

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                        <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a3.001 3.001 0 01-2.704-2.143M8 11V7a4 4 0 118 0v4m-2 8h2" className="w-8 h-8 text-primary" />
                        Ressourcenplanung
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Überblick über Team-Auslastung und Verfügbarkeit
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={async () => {
                            try {
                                const { fetchApi } = await import('../services/api/client');
                                const { toast } = await import('react-toastify');
                                toast.info('MOCO Sync gestartet...', { autoClose: 2000 });
                                const data = await fetchApi('/api/resources/sync-moco-data', { method: 'POST' });
                                if (data?.success) {
                                    toast.success(`${data.absencesImported || 0} Abwesenheiten und ${data.usersMapped || 0} User synchronisiert!`);
                                    refetch();
                                } else {
                                    toast.error(`Fehler beim Sync: ${data?.error || 'Unknown error'}`);
                                }
                            } catch (e: any) {
                                const { toast } = await import('react-toastify');
                                toast.error(`Sync fehlgeschlagen: ${e.message}`);
                            }
                        }}
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 flex items-center gap-2 rounded-lg font-medium transition-colors"
                    >
                        <Icon path="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" className="w-5 h-5" />
                        MOCO Abwesenheiten & User Sync
                    </button>
                </div>
            </div>

            <ResourceTimeline
                resources={resources}
                startDate={startDate}
                onDateChange={setStartDate}
                isLoading={isLoading}
                onDataUpdate={refetch}
            />

            {/* Legend */}
            <div className="flex gap-6 text-sm text-foreground bg-card p-4 rounded-lg border border-border shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></div>
                    <span>Verfügbar (&lt;80%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300"></div>
                    <span>Ausgelastet (80-100%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-200 border border-red-300"></div>
                    <span>Überbucht (&gt;100%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-300 border border-purple-500"></div>
                    <span>Abwesend (MOCO)</span>
                </div>
            </div>
        </div>
    );
}
