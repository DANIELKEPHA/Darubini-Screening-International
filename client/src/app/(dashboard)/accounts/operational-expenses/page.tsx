'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import HistoryTab from '@/app/(dashboard)/[slag]/os/components/[tabs]/HistoryTab';
import ExpenseForm from '@/app/(dashboard)/[slag]/os/components/ExpenseForm';
import ExpenseDetails from '@/app/(dashboard)/[slag]/os/components/ExpenseDetails';
import SearchInput from '@/app/(dashboard)/[slag]/os/components/SearchInput';
import ExpenseHeaderFields, { HeaderFields } from '@/app/(dashboard)/[slag]/os/components/ExpenseHeaderFields';
import { AuditLogFilters, OperationalExpense, OperationalExpenseFilters, SonnerToastOptions } from '@/state';
import { Button } from '@/components/ui/button';
import {
    useGetOperationalExpenseQuery,
    useGetOperationalExpensesQuery,
    useGetAuditLogsQuery
} from '@/state/api';
import { skipToken } from '@reduxjs/toolkit/query';
import ExpenseList from "@/app/(dashboard)/[slag]/os/components/ExpenseList";
import {Plus} from "lucide-react";

export default function ItemsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [selectedExpense, setSelectedExpense] = useState<OperationalExpense | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState<'drafts' | 'created' | 'history'>('created');

    const [headerFields, setHeaderFields] = useState<HeaderFields>({
        currency: 'KES',
        date: new Date().toISOString().split('T')[0],
        agentName: '',
        paymentAccountType: 'CASH',
        bankAccountId: undefined,
        cashAccountId: undefined,
    });

    const [draftFilters, setDraftFilters] = useState<OperationalExpenseFilters>({
        page: 1,
        limit: 10,
        includeDrafts: true
    });

    const [createdFilters, setCreatedFilters] = useState<OperationalExpenseFilters>({
        page: 1,
        limit: 10,
        includeDrafts: false
    });

    const [historyFilters, setHistoryFilters] = useState<AuditLogFilters>({
        page: 1,
        limit: 10,
        entity: 'OperationalExpense',
    });

    const expenseId = searchParams.get('expenseId');

    const { data: expenseData, isLoading: isExpenseLoading, error: expenseError } =
        useGetOperationalExpenseQuery(expenseId ? Number(expenseId) : skipToken);

    const { data: expensesResponse, isLoading: isExpensesLoading, error: expensesError } =
        useGetOperationalExpensesQuery({
            page: 1,
            limit: 100,
            includeDrafts: true,
        });

    const { data: auditLogsResponse, isLoading: isAuditLogsLoading, error: auditLogsError } =
        useGetAuditLogsQuery(
            activeTab === 'history'
                ? {
                    entity: 'OperationalExpense',
                    page: historyFilters.page,
                    limit: historyFilters.limit,
                    entityId: historyFilters.entityId,
                }
                : skipToken
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
            setShowForm(false);
            router.replace('/staff/Items', { scroll: false });
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
            setSelectedExpense(null);
        } else {
            const setFilters = activeTab === 'drafts' ? setDraftFilters : setCreatedFilters;
            setFilters((prev: OperationalExpenseFilters) => ({ ...prev, search, page: 1 }));
            setSelectedExpense(null);
        }
    };

    const handleEntityIdChange = (entityId: string) => {
        setHistoryFilters((prev: AuditLogFilters) => ({
            ...prev,
            entityId: entityId || undefined,
            page: 1
        }));
        setSelectedExpense(null);
    };

    const handleLimitChange = (limit: number) => {
        setHistoryFilters((prev: AuditLogFilters) => ({ ...prev, limit, page: 1 }));
        setSelectedExpense(null);
    };

    const handleNewExpense = () => {
        setIsCreating(true);
        setSelectedExpense(null);
        setShowForm(true);
    };

    const handleSelectExpense = (item: OperationalExpense | { page: number }) => {
        if ('page' in item) {
            const setFilters = activeTab === 'drafts'
                ? setDraftFilters
                : activeTab === 'history'
                    ? setHistoryFilters
                    : setCreatedFilters;

            setFilters((prev: AuditLogFilters | OperationalExpenseFilters) => ({
                ...prev,
                page: item.page
            }));
        } else {
            setSelectedExpense(item);
            setIsCreating(false);
            setShowForm(false);
        }
    };

    const handleFormClose = () => {
        setIsCreating(false);
        setSelectedExpense(null);
        setShowForm(false);
    };

    const handleTabChange = (tab: 'drafts' | 'created' | 'history') => {
        setActiveTab(tab);
        setSelectedExpense(null);
        setShowForm(false);
    };

    const currentFilters = useMemo(() => {
        if (activeTab === 'drafts') return draftFilters;
        if (activeTab === 'history') return historyFilters;
        return createdFilters;
    }, [activeTab, draftFilters, createdFilters, historyFilters]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                <div className="w-full px-4 py-4">
                    <div className="flex flex-col space-y-3">
                        {/* First row - Title and New Expense Button */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Operational Expenses</h1>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleNewExpense}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium flex items-center gap-2 shadow-sm hover:shadow-md"
                                    aria-label="Create new expense"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Expense
                                </Button>
                            </div>
                        </div>

                        {/* Second row - Header Fields */}
                        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100">
                            <ExpenseHeaderFields
                                onFieldsChange={setHeaderFields}
                                initialValues={headerFields}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - Full Width */}
            <div className="w-full px-4 py-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Tabs and Filters */}
                    <div className="border-b border-gray-200 px-6 pt-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <nav className="-mb-px flex space-x-4" role="tablist">
                                <Button
                                    variant="ghost"
                                    className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
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
                                    className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
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
                                    className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
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

                            {/* Search and Filters */}
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                {activeTab === 'history' ? (
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <select
                                            value={historyFilters.entityId || ''}
                                            onChange={(e) => handleEntityIdChange(e.target.value)}
                                            className="rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                            disabled={isExpensesLoading}
                                        >
                                            <option value="">All Expenses</option>
                                            {expensesResponse?.expenses.map((expense) => (
                                                <option key={expense.id} value={expense.id}>
                                                    {expense.expenseName}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={historyFilters.limit}
                                            onChange={(e) => handleLimitChange(Number(e.target.value))}
                                            className="rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                        >
                                            {[10, 25, 50, 100].map((value) => (
                                                <option key={value} value={value}>
                                                    {value}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : null}
                                <SearchInput
                                    onSearch={handleFilterChange}
                                    searchValue={activeTab !== 'history' ? (currentFilters as OperationalExpenseFilters).search || '' : ''}
                                    placeholder={activeTab === 'history' ? "Search audit logs..." : "Search expenses..."}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-6">
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
                </div>
            </div>

            {/* Slide-in Form from Right */}
            <div
                className={`fixed inset-y-0 right-0 w-full sm:w-[600px] lg:w-[700px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
                    showForm || selectedExpense ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="h-full overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                        <h2 className="text-xl font-bold text-gray-900">
                            {isCreating ? 'Create New Expense' : 'Expense Details'}
                        </h2>
                        <Button
                            onClick={handleFormClose}
                            variant="ghost"
                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </Button>
                    </div>
                    <div className="px-6 py-6">
                        {isCreating ? (
                            <ExpenseForm
                                expense={selectedExpense}
                                onClose={handleFormClose}
                                headerFields={headerFields}
                            />
                        ) : selectedExpense ? (
                            <ExpenseDetails
                                expense={selectedExpense}
                                onEdit={() => {
                                    setIsCreating(true);
                                    setShowForm(true);
                                }}
                                onClose={handleFormClose}
                            />
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Overlay */}
            {(showForm || selectedExpense) && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
                    onClick={handleFormClose}
                />
            )}
        </div>
    );
}