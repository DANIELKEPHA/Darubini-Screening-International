'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import HistoryTab from '@/app/(dashboard)/[slag]/os/components/[tabs]/HistoryTab';
import ExpenseForm from '@/app/(dashboard)/[slag]/os/components/ExpenseForm';
import ExpenseDetails from '@/app/(dashboard)/[slag]/os/components/ExpenseDetails';
import SearchInput from '@/app/(dashboard)/[slag]/os/components/SearchInput';
import { AuditLogFilters, OperationalExpense, OperationalExpenseFilters, SonnerToastOptions } from '@/state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    useGetOperationalExpenseQuery,
    useGetOperationalExpensesQuery,
    useGetAuditLogsQuery
} from '@/state/api';
import { skipToken } from '@reduxjs/toolkit/query';
import { Download, Upload, Filter, BarChart3, Calendar, Printer, Settings, RefreshCw, Bell } from 'lucide-react';
import ExpenseList from "@/app/(dashboard)/[slag]/os/components/ExpenseList";

export default function ItemsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [selectedExpense, setSelectedExpense] = useState<OperationalExpense | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [activeTab, setActiveTab] = useState<'drafts' | 'created' | 'history'>('created');

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
            // HistoryTab handles search client-side
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
        setSelectedExpense(null); // Ensure we're creating a new one
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

    // Utility handlers (placeholders)
    const handleExport = () => toast.success('Exporting data...', toastOptions);
    const handleImport = () => toast.info('Import feature coming soon!', toastOptions);
    const handleRefresh = () => {
        toast.success('Refreshing data...', toastOptions);
        window.location.reload();
    };
    const handleQuickFilters = () => toast.info('Quick filters applied!', toastOptions);
    const handleGenerateReport = () => toast.success('Generating report...', toastOptions);
    const handlePrint = () => {
        toast.success('Preparing for print...', toastOptions);
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Utility Section */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 py-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        {/* Left side - Title and Status */}
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Operational Expenses</h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    {activeTab === 'created'
                                        ? 'All created expenses'
                                        : activeTab === 'drafts'
                                            ? 'Draft expenses'
                                            : 'Expense history & audit logs'}
                                </p>
                            </div>
                            <div className="hidden md:flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Active
                </span>
                                <span className="text-sm text-gray-500">
                  {expensesResponse?.expenses?.length || 0} total expenses
                </span>
                            </div>
                        </div>

                        {/* Right side - Utility Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleRefresh} className="flex items-center gap-2 hover:bg-gray-50">
                                <RefreshCw className="w-4 h-4" />
                                <span className="hidden sm:inline">Refresh</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleQuickFilters} className="flex items-center gap-2 hover:bg-gray-50">
                                <Filter className="w-4 h-4" />
                                <span className="hidden sm:inline">Filters</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleGenerateReport} className="flex items-center gap-2 hover:bg-gray-50">
                                <BarChart3 className="w-4 h-4" />
                                <span className="hidden sm:inline">Report</span>
                            </Button>

                            <div className="flex items-center border-l border-gray-200 pl-2">
                                <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-2 hover:bg-gray-50">
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">Export</span>
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleImport} className="flex items-center gap-2 hover:bg-gray-50 ml-2">
                                    <Upload className="w-4 h-4" />
                                    <span className="hidden sm:inline">Import</span>
                                </Button>
                            </div>

                            <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-2 hover:bg-gray-50">
                                <Printer className="w-4 h-4" />
                                <span className="hidden sm:inline">Print</span>
                            </Button>

                            <div className="flex items-center border-l border-gray-200 pl-2">
                                <Button variant="ghost" size="sm" className="hover:bg-gray-100" onClick={() => toast.info('Notifications', toastOptions)}>
                                    <Bell className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="hover:bg-gray-100 ml-2" onClick={() => toast.info('Settings', toastOptions)}>
                                    <Settings className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="flex items-center">
                                <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                                    <option>Today</option>
                                    <option>This Week</option>
                                    <option>This Month</option>
                                    <option>Last Month</option>
                                    <option>Custom Range</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Row */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-900">Total Amount</span>
                                <BarChart3 className="w-4 h-4 text-blue-600" />
                            </div>
                            <p className="text-lg font-bold text-blue-800 mt-1">
                                {expensesResponse?.expenses
                                    ?.reduce((sum, expense) => sum + (expense.amount || 0), 0)
                                    .toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$0.00'}
                            </p>
                        </div>

                        <div className="bg-green-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-green-900">Active Expenses</span>
                                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                  {expensesResponse?.expenses?.filter(e => e.status === 'active').length || 0}
                </span>
                            </div>
                            <p className="text-lg font-bold text-green-800 mt-1">
                                {expensesResponse?.expenses
                                    ?.filter(e => e.status === 'active')
                                    .reduce((sum, expense) => sum + (expense.amount || 0), 0)
                                    .toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$0.00'}
                            </p>
                        </div>

                        <div className="bg-yellow-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-yellow-900">Drafts</span>
                                <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                  {expensesResponse?.expenses?.filter(e => e.isDraft).length || 0}
                </span>
                            </div>
                            <p className="text-lg font-bold text-yellow-800 mt-1">
                                {expensesResponse?.expenses
                                    ?.filter(e => e.isDraft)
                                    .reduce((sum, expense) => sum + (expense.amount || 0), 0)
                                    .toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$0.00'}
                            </p>
                        </div>

                        <div className="bg-purple-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-purple-900">Avg. Expense</span>
                                <Calendar className="w-4 h-4 text-purple-600" />
                            </div>
                            <p className="text-lg font-bold text-purple-800 mt-1">
                                {expensesResponse?.expenses?.length
                                    ? (expensesResponse.expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0) /
                                        expensesResponse.expenses.length)
                                        .toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
                                    : '$0.00'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 sm:px-6 py-6">
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                    <Card className="w-full lg:w-1/3 bg-white rounded-lg shadow-lg p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Operational</h1>
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
                                    {isExpensesLoading && <p className="text-sm text-gray-500 mt-1">Loading expenses...</p>}
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

                        <div
                            className="mt-4"
                            id={
                                activeTab === 'created'
                                    ? 'created-panel'
                                    : activeTab === 'history'
                                        ? 'history-panel'
                                        : 'drafts-panel'
                            }
                            role="tabpanel"
                        >
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
                                <p className="text-sm mt-2">
                                    Select an expense from the list or create a new one to get started.
                                </p>
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
        </div>
    );
}