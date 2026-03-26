'use client';

import { useRouter } from 'next/navigation';
import { Users, UserPlus, Receipt, FileText } from 'lucide-react';

export default function UtilitiesTab() {
    const router = useRouter();

    const utilities = [
        {
            label: 'My Expenses',
            icon: FileText,
            path: '/staff/client-expenses',
            description: 'View and manage your personal expenses',
            highlight: true,
        },
        {
            label: 'Add Client',
            icon: UserPlus,
            path: '/staff/clients',
            description: 'Register new client profiles',
        },
        {
            label: 'Invoices',
            icon: Receipt,
            path: '/staff/client-expenses/components/invoices',
            description: 'Create and track client invoices',
        },
    ];

    const handleNavigate = (path: string) => {
        router.push(path);
    };

    return (
        <div className="p-6 bg-background">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* 1. My Expenses - Forced to appear FIRST */}
                {(() => {
                    const expensesItem = utilities.find(item => item.label === 'My Expenses');
                    if (!expensesItem) return null;

                    const Icon = expensesItem.icon;

                    return (
                        <button
                            key={expensesItem.label}
                            onClick={() => handleNavigate(expensesItem.path)}
                            className="group relative p-5 bg-card border border-border rounded-xl text-left transition-all duration-200 hover:border-primary/30 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ring-1 ring-primary/20 border-primary/30"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <h3 className="font-medium text-foreground text-sm leading-tight">
                                        {expensesItem.label}
                                    </h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {expensesItem.description}
                                    </p>
                                </div>
                            </div>

                            <div className="absolute top-5 right-5 text-muted-foreground/40 group-hover:text-muted-foreground/80 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                    );
                })()}

                {/* 2. Remaining Utilities (excluding My Expenses) */}
                {utilities
                    .filter(item => item.label !== 'My Expenses')
                    .map(item => {
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.label}
                                onClick={() => handleNavigate(item.path)}
                                className={`group relative p-5 bg-card border border-border rounded-xl text-left transition-all duration-200 hover:border-primary/30 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                    item.highlight ? 'ring-1 ring-primary/20 border-primary/30' : ''
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`p-3 rounded-lg transition-colors ${
                                            item.highlight
                                                ? 'bg-primary/10 text-primary'
                                                : 'bg-muted text-muted-foreground group-hover:bg-primary/5'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <h3 className="font-medium text-foreground text-sm leading-tight">
                                            {item.label}
                                        </h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="absolute top-5 right-5 text-muted-foreground/40 group-hover:text-muted-foreground/80 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </button>
                        );
                    })}
            </div>
        </div>
    );
}