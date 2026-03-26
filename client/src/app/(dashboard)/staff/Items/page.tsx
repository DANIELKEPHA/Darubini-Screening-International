'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import ExpenseList from './components/ExpenseList';
import HistoryTab from './components/[tabs]/HistoryTab';
import ExpenseForm from './components/ExpenseForm';
import ExpenseDetails from './components/ExpenseDetails';
import SearchInput from './components/SearchInput';
import { OperationalExpense, OperationalExpenseFilters } from '@/state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useGetOperationalExpenseQuery, useGetOperationalExpensesQuery, useGetAuditLogsQuery } from '@/state/api';
import { skipToken } from '@reduxjs/toolkit/query';

// Define interface for audit log filters
interface AuditLogFilters {
    page?: number;
    limit?: number;
    entity?: string;
    entityId?: string;
}

interface SonnerToastOptions {
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    duration?: number;
    closeButton?: boolean;
    onDismiss?: () => void;
    onAutoClose?: () => void;
}

export default function ItemsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedExpense, setSelectedExpense] = useState<OperationalExpense | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [activeTab, setActiveTab] = useState<'drafts' | 'created' | 'history'>('created');
    const [draftFilters, setDraftFilters] = useState<OperationalExpenseFilters>({ page: 1, limit: 10, includeDrafts: true });
    const [createdFilters, setCreatedFilters] = useState<OperationalExpenseFilters>({ page: 1, limit: 10, includeDrafts: false });
    const [historyFilters, setHistoryFilters] = useState<AuditLogFilters>({
        page: 1,
        limit: 10,
        entity: 'OperationalExpense',
    });

    const expenseId = searchParams.get('expenseId');
    const { data: expenseData, isLoading: isExpenseLoading, error: expenseError } =
        useGetOperationalExpenseQuery(
            expenseId ? Number(expenseId) : skipToken
        );

    const { data: expensesResponse, isLoading: isExpensesLoading, error: expensesError } = useGetOperationalExpensesQuery({
        page: 1,
        limit: 100,
        includeDrafts: true,
    });
    const { data: auditLogsResponse, isLoading: isAuditLogsLoading, error: auditLogsError } = useGetAuditLogsQuery(
        activeTab === 'history' ? {
            entity: 'OperationalExpense',
            page: historyFilters.page,
            limit: historyFilters.limit,
            entityId: historyFilters.entityId,
        } : skipToken
    );

    const toastOptions: SonnerToastOptions = {
        position: 'top-right',
        duration: 5000,
        closeButton: true,
    };

    useEffect(() => {
        if (expenseId && expenseData) {
            setSelectedExpense(expenseData);
            setIsCreating(false);
            router.replace('/admin/Items', { scroll: false });
        } else if (expenseId && expenseError) {
            toast.error('Failed to load expense', toastOptions);
        }
        if (expensesError && activeTab === 'history') {
            toast.error(`Failed to load expenses: ${(expensesError as any)?.data?.message || 'Unknown error'}`, toastOptions);
        }
        if (auditLogsError && activeTab === 'history') {
            toast.error(`Failed to load audit logs: ${(auditLogsError as any)?.data?.message || 'Unknown error'}`, toastOptions);
        }
    }, [expenseId, expenseData, expenseError, expensesError, auditLogsError, activeTab, router]);

    const handleFilterChange = (search: string) => {
        if (activeTab === 'history') {
            // HistoryTab handles search client-side, so no need to update historyFilters
            setSelectedExpense(null);
        } else {
            const setFilters = activeTab === 'drafts' ? setDraftFilters : setCreatedFilters;
            setFilters((prev: OperationalExpenseFilters) => ({ ...prev, search, page: 1 }));
            setSelectedExpense(null);
        }
    };

    const handleEntityIdChange = (entityId: string) => {
        setHistoryFilters((prev: AuditLogFilters) => ({ ...prev, entityId: entityId || undefined, page: 1 }));
        setSelectedExpense(null);
    };

    const handleLimitChange = (limit: number) => {
        setHistoryFilters((prev: AuditLogFilters) => ({ ...prev, limit, page: 1 }));
        setSelectedExpense(null);
    };

    const handleNewExpense = () => {
        setSelectedExpense(null);
        setIsCreating(true);
    };

    const handleSelectExpense = (item: OperationalExpense | { page: number }) => {
        if ('page' in item) {
            const setFilters = activeTab === 'drafts' ? setDraftFilters : activeTab === 'history' ? setHistoryFilters : setCreatedFilters;
            setFilters((prev: AuditLogFilters | OperationalExpenseFilters) => ({ ...prev, page: item.page }));
        } else {
            setSelectedExpense(item);
            setIsCreating(false);
        }
    };

    const handleFormClose = () => {
        setIsCreating(false);
        setSelectedExpense(null);
    };

    const handleTabChange = (tab: 'drafts' | 'created' | 'history') => {
        setActiveTab(tab);
        setSelectedExpense(null);
    };

    const currentFilters = useMemo(() => {
        if (activeTab === 'drafts') return draftFilters;
        if (activeTab === 'history') return historyFilters;
        return createdFilters;
    }, [activeTab, draftFilters, createdFilters, historyFilters]);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                <Card className="w-full lg:w-1/3 bg-white rounded-lg shadow-lg p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Expenses</h1>
                        <Button
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
                            onClick={handleNewExpense}
                            aria-label="Create new expense"
                        >
                            New Expense
                        </Button>
                    </div>
                    <div className="border-b border-gray-200 mb-4">
                        <nav className="-mb-px flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4" role="tablist">
                            <Button
                                variant="ghost"
                                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                                    activeTab === 'created'
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                                onClick={() => handleTabChange('created')}
                                role="tab"
                                aria-selected={activeTab === 'created'}
                                aria-controls="created-panel"
                            >
                                Created
                            </Button>
                            <Button
                                variant="ghost"
                                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                                    activeTab === 'drafts'
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                                onClick={() => handleTabChange('drafts')}
                                role="tab"
                                aria-selected={activeTab === 'drafts'}
                                aria-controls="drafts-panel"
                            >
                                Drafts
                            </Button>
                            <Button
                                variant="ghost"
                                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                                    activeTab === 'history'
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                                onClick={() => handleTabChange('history')}
                                role="tab"
                                aria-selected={activeTab === 'history'}
                                aria-controls="history-panel"
                            >
                                History
                            </Button>
                        </nav>
                    </div>
                    {activeTab === 'history' ? (
                        <div className="flex flex-col gap-4 mb-4">
                            <div>
                                <label htmlFor="entityId" className="block text-sm font-medium text-gray-700 mb-1">
                                    Filter by Expense
                                </label>
                                <select
                                    id="entityId"
                                    value={historyFilters.entityId || ''}
                                    onChange={(e) => handleEntityIdChange(e.target.value)}
                                    className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 px-4 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                    disabled={isExpensesLoading}
                                >
                                    <option value="">All Operational Expenses</option>
                                    {expensesResponse?.expenses.map((expense) => (
                                        <option key={expense.id} value={expense.id}>
                                            {expense.id} - {expense.expenseName} ({expense.currency} {expense.amount})
                                        </option>
                                    ))}
                                </select>
                                {isExpensesLoading && (
                                    <p className="text-sm text-gray-500 mt-1">Loading expenses...</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">
                                    Items per Page
                                </label>
                                <select
                                    id="limit"
                                    value={historyFilters.limit}
                                    onChange={(e) => handleLimitChange(Number(e.target.value))}
                                    className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 px-4 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                >
                                    {[10, 25, 50, 100].map((value) => (
                                        <option key={value} value={value}>
                                            {value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <SearchInput
                                onSearch={handleFilterChange}
                                searchValue=""
                                placeholder="Search audit logs by action, actor, or expense..."
                            />
                        </div>
                    ) : (
                        <SearchInput
                            onSearch={handleFilterChange}
                            searchValue={(currentFilters as OperationalExpenseFilters).search || ''}
                            placeholder="Search expenses by name or ID..."
                        />
                    )}
                    <div className="mt-4" id={activeTab === 'created' ? 'created-panel' : activeTab === 'history' ? 'history-panel' : 'drafts-panel'} role="tabpanel">
                        {activeTab === 'history' ? (
                            <>
                                <HistoryTab
                                    auditLogs={auditLogsResponse?.data || []}
                                    isLoading={isAuditLogsLoading}
                                    error={auditLogsError}
                                    showEntityId
                                />
                                {auditLogsResponse && auditLogsResponse.total > 0 && historyFilters.page !== undefined && (
                                    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                                        <Button
                                            disabled={historyFilters.page === 1}
                                            onClick={() => handleSelectExpense({ page: historyFilters.page! - 1 })}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                                        >
                                            Previous
                                        </Button>
                                        <span className="text-gray-600 text-sm">
                                            Page {historyFilters.page} of {auditLogsResponse.totalPages || 1} (Total: {auditLogsResponse.total} logs)
                                        </span>
                                        <Button
                                            disabled={historyFilters.page >= (auditLogsResponse.totalPages || 1)}
                                            onClick={() => handleSelectExpense({ page: historyFilters.page! + 1 })}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <ExpenseList
                                filters={currentFilters as OperationalExpenseFilters}
                                onSelect={handleSelectExpense}
                                selectedExpenseId={selectedExpense?.id}
                            />
                        )}
                    </div>
                </Card>
                <Card className="w-full lg:w-2/3 bg-white rounded-lg shadow-lg p-4 sm:p-6">
                    {isCreating ? (
                        <ExpenseForm expense={selectedExpense} onClose={handleFormClose} />
                    ) : selectedExpense ? (
                        <ExpenseDetails
                            expense={selectedExpense}
                            onEdit={() => setIsCreating(true)}
                            onClose={() => setSelectedExpense(null)}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                            <p className="text-lg font-medium">No expense selected</p>
                            <p className="text-sm mt-2">Select an expense from the list or create a new one to get started.</p>
                            <Button
                                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
                                onClick={handleNewExpense}
                                aria-label="Create new expense"
                            >
                                Create New Expense
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}