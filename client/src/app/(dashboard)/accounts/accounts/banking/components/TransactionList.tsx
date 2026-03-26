'use client';

import { useGetTransactionsQuery } from '@/state/api';
import { Transaction, TransactionFilters } from '@/state';
import { formatEnumString } from '@/lib/utils';

interface TransactionListProps {
    filters: TransactionFilters;
    onSelect: (transaction: Transaction) => void;
    selectedTransactionId?: number;
    onInitiatePayment: () => void;
    onPageChange: (page: number) => void;
}

export default function TransactionList({
                                            filters,
                                            onSelect,
                                            selectedTransactionId,
                                            onInitiatePayment,
                                            onPageChange,
                                        }: TransactionListProps) {
    const { data, isLoading, error } = useGetTransactionsQuery(filters);

    return (
        <div className="mt-4">
            {isLoading && <p className="text-gray-500">Loading...</p>}
            {error && <p className="text-red-600">{(error as any).data?.message || 'Error loading transactions'}</p>}
            {data && data.transactions.length === 0 && (
                <p className="text-gray-500">No transactions found</p>
            )}
            {data && data.transactions.length > 0 && (
                <div className="space-y-2">
                    {data.transactions.map((transaction: Transaction) => (
                        <div
                            key={transaction.id}
                            className={`p-3 rounded-md cursor-pointer hover:bg-blue-50 transition-colors ${
                                selectedTransactionId === transaction.id ? 'bg-blue-100 border-l-4 border-blue-600' : 'bg-white'
                            }`}
                            onClick={() => onSelect(transaction)}
                        >
                            <p className="font-medium text-gray-800">{transaction.payee}</p>
                            <p className="text-sm text-gray-500">
                                {transaction.currency} {transaction.amount} • {formatEnumString(transaction.status)}
                            </p>
                        </div>
                    ))}
                    <div className="flex justify-between mt-4">
                        <button
                            disabled={filters.page === 1}
                            onClick={() => filters.page && filters.page > 1 && onPageChange(filters.page - 1)}
                            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                        >
                            Previous
                        </button>
                        <span className="text-gray-600">Page {data.page} of {data.totalPages}</span>
                        <button
                            disabled={data.page === data.totalPages}
                            onClick={() => onPageChange((filters.page || 1) + 1)}
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