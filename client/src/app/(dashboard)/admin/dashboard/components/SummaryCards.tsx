'use client';

import { useState, useEffect } from 'react';
import { useGetCashAccountsQuery } from '@/state/api';
import { OperationalExpense } from '@/state';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface SummaryCardsProps {
    expenses: OperationalExpense[];
}

export default function SummaryCards({ expenses }: SummaryCardsProps) {
    const { data: accountsData, isLoading: isAccountsLoading, error: accountsError } = useGetCashAccountsQuery({ page: 1, limit: 100 }); // Fetch all accounts
    const accounts = accountsData?.accounts || [];
    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);
    const baseCurrency = accounts[0]?.currency || 'KES';

    const [displayTotalBalance, setDisplayTotalBalance] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = totalBalance;
        const duration = 1500;
        const increment = end / (duration / 16);

        const animate = () => {
            start += increment;
            if (start >= end) {
                setDisplayTotalBalance(end);
                return;
            }
            setDisplayTotalBalance(start);
            requestAnimationFrame(animate);
        };

        if (!isAccountsLoading && !accountsError) {
            requestAnimationFrame(animate);
        }
    }, [totalBalance, isAccountsLoading, accountsError]);

    const totalExpenses = expenses.reduce((sum, exp) => {
        const amount = typeof exp.amount === 'string' ? parseFloat(exp.amount) : exp.amount || 0;
        return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    const approvedCount = expenses.filter(exp => exp.expenseStatus === 'APPROVED').length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700">Total Expenses</h3>
                <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totalExpenses, expenses[0]?.currency || 'KES')}
                </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700">Cash Account Balance</h3>
                {isAccountsLoading ? (
                    <Skeleton className="h-8 w-32 mt-2" />
                ) : accountsError ? (
                    <p className="text-sm text-red-600">Error loading balance</p>
                ) : (
                    <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(displayTotalBalance, baseCurrency)}
                    </p>
                )}
            </div>
            <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700">Approved Expenses</h3>
                <p className="text-2xl font-bold text-blue-600">{approvedCount}</p>
            </div>
        </div>
    );
}