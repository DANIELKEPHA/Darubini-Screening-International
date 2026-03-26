'use client';

import { useState } from 'react';
import { useGetAuditLogsQuery, useGetOperationalExpensesQuery } from '@/state/api';
import { toast } from 'sonner';
import HistoryTab from "@/app/(dashboard)/[slag]/os/components/[tabs]/HistoryTab";

interface SonnerToastOptions {
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    duration?: number;
    closeButton?: boolean;
    onDismiss?: () => void;
    onAutoClose?: () => void;
}

export default function AuditLogPage() {
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        entity: 'OperationalExpense',
        entityId: '',
    });

    // Fetch operational expenses for the dropdown
    const { data: expensesResponse, isLoading: isExpensesLoading, error: expensesError } = useGetOperationalExpensesQuery({
        page: 1,
        limit: 100,
        includeDrafts: true,
    });

    const { data: auditLogsResponse, isLoading, error } = useGetAuditLogsQuery(filters);
    const auditLogs = auditLogsResponse?.data || [];

    // Toast options for Sonner
    const toastOptions: SonnerToastOptions = {
        position: 'top-right',
        duration: 5000,
        closeButton: true,
    };

    // Handle error toast
    if (error) {
        toast.error(`Failed to load audit logs: ${(error as any)?.data?.message || 'Unknown error'}`, toastOptions);
    }
    if (expensesError) {
        toast.error(`Failed to load expenses: ${(expensesError as any)?.data?.message || 'Unknown error'}`, toastOptions);
    }

    const handlePageChange = (page: number) => {
        setFilters((prev) => ({ ...prev, page }));
    };

    const handleEntityIdChange = (entityId: string) => {
        setFilters((prev) => ({ ...prev, entityId, page: 1 }));
    };

    const handleLimitChange = (limit: number) => {
        setFilters((prev) => ({ ...prev, limit, page: 1 }));
    };

    return (
        <div className="container mx-auto p-6 min-h-screen bg-gray-50">
            <div className="bg-white rounded-xl shadow-lg p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Audit Log</h1>

                {/* Filters Section */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <label htmlFor="entityId" className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Expense ID
                        </label>
                        <select
                            id="entityId"
                            value={filters.entityId}
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
                    <div className="w-32">
                        <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">
                            Items per Page
                        </label>
                        <select
                            id="limit"
                            value={filters.limit}
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
                </div>

                {/* Audit Logs Table/Timeline */}
                <HistoryTab auditLogs={auditLogs} isLoading={isLoading} error={error} showEntityId />

                {/* Pagination */}
                {auditLogsResponse && auditLogsResponse.total > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                        <button
                            disabled={filters.page === 1}
                            onClick={() => handlePageChange(filters.page - 1)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-gray-600 text-sm">
                            Page {filters.page} of {auditLogsResponse.totalPages || 1} (Total: {auditLogsResponse.total} logs)
                        </span>
                        <button
                            disabled={filters.page === auditLogsResponse.totalPages}
                            onClick={() => handlePageChange(filters.page + 1)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}