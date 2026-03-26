'use client';

import { useState } from 'react';
import { useGetTransactionsQuery, useGetOperationalExpensesQuery, useReconcileTransactionMutation } from '@/state/api';
import { Transaction, TransactionFilters } from '@/state';
import { withToast } from '@/lib/utils';

export default function ReconciliationView() {
    const [filters, setFilters] = useState<TransactionFilters>({ page: 1, limit: 10 });
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [expenseId, setExpenseId] = useState<number | undefined>(undefined);

    const { data: transactionsData, isLoading: isLoadingTransactions, error: transactionsError } = useGetTransactionsQuery(filters);
    const { data: expensesData, isLoading: isLoadingExpenses } =
        useGetOperationalExpensesQuery({ page: 1, limit: 100, includeDrafts: false });

    const [reconcileTransaction, { isLoading: isReconciling }] = useReconcileTransactionMutation();

    const handleReconcile = async (transactionId: number) => {
        try {
            await withToast(
                reconcileTransaction({ id: transactionId, expenseId }).unwrap(),
                { success: 'Transaction reconciled', error: 'Failed to reconcile transaction' }
            );
            setSelectedTransaction(null);
            setExpenseId(undefined);
        } catch (err) {
            // Error toast handled by withToast
        }
    };

    return (
        <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Reconcile Transactions</h3>
            {isLoadingTransactions && <p className="text-gray-500">Loading transactions...</p>}
            {transactionsError && <p className="text-red-600">{(transactionsError as any).data?.message || 'Error loading transactions'}</p>}
            {transactionsData && transactionsData.transactions.length === 0 && (
                <p className="text-gray-500">No transactions to reconcile</p>
            )}
            {transactionsData && transactionsData.transactions.length > 0 && (
                <div className="space-y-2">
                    {transactionsData.transactions.map((transaction: Transaction) => (
                        <div
                            key={transaction.id}
                            className={`p-3 rounded-md border ${
                                selectedTransaction?.id === transaction.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <div onClick={() => setSelectedTransaction(transaction)} className="cursor-pointer">
                                    <p className="font-medium text-gray-800">{transaction.payee}</p>
                                    <p className="text-sm text-gray-500">
                                        {transaction.currency} {transaction.amount} • {transaction.status}
                                    </p>
                                </div>
                                {selectedTransaction?.id === transaction.id && (
                                    <div className="flex items-center space-x-2">
                                        <select
                                            value={expenseId || ''}
                                            onChange={(e) => setExpenseId(e.target.value ? Number(e.target.value) : undefined)}
                                            className="rounded-lg border border-gray-200 py-1.5 px-2 text-sm"
                                            disabled={isLoadingExpenses || isReconciling}
                                        >
                                            <option value="">Unlink or Select Expense</option>
                                            {expensesData?.expenses
                                                ?.filter((exp) => exp.expenseStatus === 'APPROVED' && !exp.paymentStatus)
                                                .map((expense) => (
                                                    <option key={expense.id} value={expense.id}>
                                                        Expense #{expense.id} - {expense.amount}
                                                    </option>
                                                ))}
                                        </select>
                                        <button
                                            onClick={() => handleReconcile(transaction.id)}
                                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                            disabled={isReconciling}
                                        >
                                            Reconcile
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-between mt-4">
                        <button
                            disabled={filters.page === 1}
                            onClick={() => filters.page && filters.page > 1 && setFilters({ ...filters, page: filters.page - 1 })}
                            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                        >
                            Previous
                        </button>
                        <span className="text-gray-600">Page {transactionsData.page} of {transactionsData.totalPages}</span>
                        <button
                            disabled={transactionsData.page === transactionsData.totalPages}
                            onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
