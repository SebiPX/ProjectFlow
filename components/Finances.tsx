import React, { useState } from 'react';
import { TimeApprovalList } from './TimeApprovalList';
import { Icon } from './ui/Icon';

type Tab = 'overview' | 'approvals' | 'expenses';

export const Finances: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('approvals');

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">Financial Management</h1>
                <p className="mt-2 text-muted-foreground">Manage time approvals, expenses, and financial reports.</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-card/50 p-1 rounded-lg w-fit mb-8 border border-border">
                <button
                    onClick={() => setActiveTab('approvals')}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'approvals'
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'text-muted-foreground hover:text-primary-foreground hover:bg-card'
                        }`}
                >
                    <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 mr-2" />
                    Time Approvals
                </button>
                <button
                    onClick={() => setActiveTab('expenses')}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'expenses'
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'text-muted-foreground hover:text-primary-foreground hover:bg-card'
                        }`}
                >
                    <Icon path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 mr-2" />
                    Global Expenses
                </button>
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'overview'
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'text-muted-foreground hover:text-primary-foreground hover:bg-card'
                        }`}
                >
                    <Icon path="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" className="w-4 h-4 mr-2" />
                    Reports Overview
                </button>
            </div>

            {/* Content */}
            <div className="bg-background rounded-xl">
                {activeTab === 'approvals' && (
                    <div>
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-foreground">Pending Time Approvals</h2>
                            <p className="text-muted-foreground text-sm">Review and approve submitted time entries from your team.</p>
                        </div>
                        <TimeApprovalList />
                    </div>
                )}

                {activeTab === 'expenses' && (
                    <div className="text-center py-20 border border-border rounded-lg border-dashed">
                        <Icon path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-muted-foreground">Global Expenses</h3>
                        <p className="text-muted-foreground mt-2">Aggregated view of all project costs coming soon.</p>
                    </div>
                )}

                {activeTab === 'overview' && (
                    <div className="text-center py-20 border border-border rounded-lg border-dashed">
                        <Icon path="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-muted-foreground">Financial Reports</h3>
                        <p className="text-muted-foreground mt-2">Detailed profitability analysis coming soon.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
