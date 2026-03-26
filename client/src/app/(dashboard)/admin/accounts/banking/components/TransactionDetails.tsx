'use client';

import { Transaction } from '@/state';
import { formatEnumString } from '@/lib/utils';

interface TransactionDetailsProps {
    transaction: Transaction;
    onEdit: () => void;
    onClose: () => void;
}

export default function TransactionDetails({ transaction, onEdit, onClose }: TransactionDetailsProps) {
    return (
        <div className="p-6 bg-white rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{transaction.payee}</h2>
                <div className="space-x-4">
                    <button
                        onClick={onEdit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Initiate Payment
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>
            <div className="space-y-2">
                <p className="text-sm text-gray-700">
                    <span className="font-medium">Amount:</span> {transaction.currency} {transaction.amount}
                </p>
                <p className="text-sm text-gray-700">
                    <span className="font-medium">Status:</span> {formatEnumString(transaction.status)}
                </p>
                <p className="text-sm text-gray-700">
                    <span className="font-medium">Date:</span> {new Date(transaction.date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-700">
                    <span className="font-medium">Linked Expense:</span> {transaction.expenseId ? `Expense #${transaction.expenseId}` : 'Not linked'}
                </p>
                <p className="text-sm text-gray-700">
                    <span className="font-medium">Bank Account:</span> {transaction.bankAccount ? `${transaction.bankAccount.bankName} (${transaction.bankAccount.accountNumber})` : 'N/A'}
                </p>
            </div>
        </div>
    );
}