import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { getServiceProfitabilityStats } from '../services/api/reports';
import { Icon } from './ui/Icon';



const COLORS = {
    revenue: '#3b82f6', // blue-500
    profit: '#10b981', // green-500
    cost: '#ef4444',   // red-500
};

export const Reports: React.FC = () => {
    const { data: stats, isLoading, isError } = useQuery({
        queryKey: ['reports-service-profitability'],
        queryFn: getServiceProfitabilityStats,
    });

    const [sortBy, setSortBy] = useState<'revenue' | 'profit' | 'margin'>('profit');

    const sortedStats = React.useMemo(() => {
        if (!stats) return [];
        return [...stats].map(s => ({
            ...s,
            margin_percent: parseFloat(s.margin_percent as unknown as string) || 0,
            profit: parseFloat(s.profit as unknown as string) || 0,
            revenue: parseFloat(s.revenue as unknown as string) || 0,
            cost: parseFloat(s.cost as unknown as string) || 0,
            hours_tracked: parseFloat(s.hours_tracked as unknown as string) || 0,
        })).sort((a, b) => {
            if (sortBy === 'margin') return b.margin_percent - a.margin_percent;
            return b[sortBy] - a[sortBy];
        });
    }, [stats, sortBy]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center py-20">
                <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white">Error loading reports</h3>
                <p className="text-gray-400 mt-2">Could not fetch profitability data.</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
                <p className="mt-2 text-gray-400">Deep dive into service performance and profitability.</p>
            </div>

            {/* Chart Section */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <Icon path="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" className="w-5 h-5 mr-2 text-blue-400" />
                        Service Profitability Overview
                    </h2>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="profit">Sort by Profit</option>
                        <option value="revenue">Sort by Revenue</option>
                        <option value="margin">Sort by Margin %</option>
                    </select>
                </div>

                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={sortedStats.slice(0, 10)} // Top 10
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis
                                dataKey="service_name"
                                stroke="#9ca3af"
                                tick={{ fill: '#9ca3af' }}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#9ca3af"
                                tick={{ fill: '#9ca3af' }}
                                tickLine={false}
                                tickFormatter={(value) => `€${value / 1000}k`}
                            />
                            <Tooltip
                                cursor={{ fill: '#1f2937' }}
                                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem' }}
                                itemStyle={{ color: '#e5e7eb' }}
                                formatter={(value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)}
                            />
                            <Legend />
                            <Bar dataKey="revenue" name="Revenue" fill={COLORS.revenue} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="cost" name="Cost" fill={COLORS.cost} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="profit" name="Profit" fill={COLORS.profit} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Performance Details</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-900/50 text-gray-400 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Service Module</th>
                                <th className="px-6 py-4 font-semibold">Category</th>
                                <th className="px-6 py-4 font-semibold text-right">Revenue</th>
                                <th className="px-6 py-4 font-semibold text-right">Cost</th>
                                <th className="px-6 py-4 font-semibold text-right">Profit</th>
                                <th className="px-6 py-4 font-semibold text-right">Margin</th>
                                <th className="px-6 py-4 font-semibold text-right">Activity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {sortedStats.map((stat) => (
                                <tr key={stat.service_module_id} className="hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{stat.service_name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                                            {stat.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-300">
                                        {formatCurrencyLocal(stat.revenue)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-300">
                                        {formatCurrencyLocal(stat.cost)}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-medium ${stat.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatCurrencyLocal(stat.profit)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end">
                                            <span className={`text-sm font-semibold mr-2 ${getMarginColor(stat.margin_percent)}`}>
                                                {stat.margin_percent.toFixed(1)}%
                                            </span>
                                            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${getMarginBgColor(stat.margin_percent)}`}
                                                    style={{ width: `${Math.min(Math.max(stat.margin_percent, 0), 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-400 text-sm">
                                        {stat.hours_tracked.toFixed(1)}h
                                    </td>
                                </tr>
                            ))}
                            {sortedStats.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No data available. Ensure you have approved invoices and tracked time linked to services.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Helper functions (duplicated locally to ensure self-containment if imports fail)
function formatCurrencyLocal(amount: number) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
}

function getMarginColor(margin: number) {
    if (margin >= 30) return 'text-green-500'; // Excellent
    if (margin >= 20) return 'text-blue-500';  // Good
    if (margin >= 10) return 'text-yellow-500'; // Acceptable
    if (margin >= 0) return 'text-orange-500';  // Poor
    return 'text-red-500'; // Negative
}

function getMarginBgColor(margin: number) {
    if (margin >= 30) return 'bg-green-500';
    if (margin >= 20) return 'bg-blue-500';
    if (margin >= 10) return 'bg-yellow-500';
    if (margin >= 0) return 'bg-orange-500';
    return 'bg-red-500';
}
