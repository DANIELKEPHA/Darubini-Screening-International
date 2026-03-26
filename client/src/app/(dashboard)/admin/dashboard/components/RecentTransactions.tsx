'use client';

import { OperationalExpense } from '@/state';
import { formatEnumString } from '@/lib/utils';

interface RecentTransactionsProps {
    expenses: OperationalExpense[];
    selectedCategory: string | null;
    onApprove: (id: number) => void;
    onEdit: (expense: OperationalExpense) => void;
    onView: (expense: OperationalExpense) => void;
}

export default function RecentTransactions({ expenses, selectedCategory, onApprove, onEdit, onView }: RecentTransactionsProps) {
    const filteredExpenses = selectedCategory
        ? expenses.filter(exp => exp.accountType === selectedCategory)
        : expenses;

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Transactions</h2>
            {filteredExpenses.length === 0 ? (
                <p className="text-gray-500">No transactions found</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>

                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filteredExpenses.map((expense) => (
                            <tr key={expense.id} className="hover:bg-blue-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.expenseName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.currency} {expense.amount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatEnumString(expense.accountType)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatEnumString(expense.expenseStatus)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(expense.date).toLocaleDateString()}</td>

                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}