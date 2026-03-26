'use client';

import { useGetOperationalExpensesQuery } from '@/state/api';
import { OperationalExpense, OperationalExpenseFilters } from '@/state';
import { formatEnumString } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ExpenseListProps {
  filters: OperationalExpenseFilters;
  onSelect: (expense: OperationalExpense | { page: number }) => void;
  selectedExpenseId?: number;
}

export default function ExpenseList({ filters, onSelect, selectedExpenseId }: ExpenseListProps) {
  const { data, isLoading, error } = useGetOperationalExpensesQuery(filters);

  // Function to determine the text color class based on expense status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-blue-600';
      case 'approved':
        return 'text-green-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-black';
    }
  };

  return (
      <div className="mt-4">
        {isLoading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-600">Error loading expenses</p>}
        {data && data.expenses.length === 0 && (
            <p className="text-gray-500">No expenses found</p>
        )}
        {data && data.expenses.length > 0 && (
            <div className="space-y-2">
              {data.expenses.map((expense) => (
                  <div
                      key={expense.id}
                      className={`p-3 rounded-md cursor-pointer hover:bg-primary-50 transition-colors ${
                          selectedExpenseId === expense.id ? 'bg-primary-100 border-l-4 border-primary-600' : 'bg-white'
                      }`}
                      onClick={() => onSelect(expense)}
                  >
                    <p className="font-medium text-primary-800">{expense.expenseName}</p>
                    <p className="text-sm text-gray-500">
                      {expense.currency} {expense.amount} •{' '}
                      <span className={getStatusColor(expense.expenseStatus)}>
                  {formatEnumString(expense.expenseStatus)}
                </span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Balance: {expense.bankAccount
                        ? `${expense.bankAccount.currency} ${expense.bankAccount.balance}`
                        : expense.cashAccount
                            ? `${expense.cashAccount.currency} ${expense.cashAccount.balance}`
                            : 'N/A'}
                    </p>
                  </div>
              ))}
              <div className="flex justify-between mt-4">
                <Button
                    disabled={filters.page === 1}
                    onClick={() => filters.page && filters.page > 1 && onSelect({ page: filters.page - 1 })}
                    variant="outline"
                >
                  Previous
                </Button>
                <span className="text-gray-600">Page {data.page} of {data.totalPages}</span>
                <Button
                    disabled={data.page === data.totalPages}
                    onClick={() => onSelect({ page: (filters.page || 1) + 1 })}
                    variant="outline"
                >
                  Next
                </Button>
              </div>
            </div>
        )}
      </div>
  );
}