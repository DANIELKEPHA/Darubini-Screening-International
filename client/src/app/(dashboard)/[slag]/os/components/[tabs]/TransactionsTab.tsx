'use client';

import { Transaction } from '@/state';
import { formatEnumString, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface TransactionsTabProps {
    transactions: Transaction[];
    isLoading: boolean;
    error: any;
}

export default function TransactionsTab({ transactions, isLoading, error }: TransactionsTabProps) {
    return (
        <Card className="p-6 bg-primary-50">
            <h3 className="text-lg font-semibold text-primary-800 mb-4">Transactions</h3>
            {isLoading && (
                <div className="text-center text-primary-600">Loading transactions...</div>
            )}
            {error && (
                <div className="text-red-600 font-medium">
                    Error loading transactions: {error?.data?.message || 'Unknown error'}
                </div>
            )}
            {!isLoading && !error && transactions.length === 0 ? (
                <p className="text-primary-600">No transactions available</p>
            ) : (
                <div className="space-y-4">
                    {transactions.map((transaction) => (
                        <Card key={transaction.id} className="p-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-primary-800">
                                        {transaction.currency} {transaction.amount}
                                    </p>
                                    <p className="text-sm text-primary-600">
                                        {formatDate(transaction.date)} • {formatEnumString(transaction.status)}
                                    </p>
                                    <p className="text-sm text-primary-600">{transaction.description || 'No description'}</p>
                                </div>
                                <div className="text-sm text-primary-600">
                                    <p>Account: {transaction.bankAccount
                                        ? `${transaction.bankAccount.accountName} (${transaction.bankAccount.accountNumber})`
                                        : transaction.cashAccount
                                            ? `${transaction.cashAccount.accountName} (${transaction.cashAccount.accountNumber})`
                                            : 'N/A'}</p>
                                    <p>Transaction ID: {transaction.id}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </Card>
    );
}