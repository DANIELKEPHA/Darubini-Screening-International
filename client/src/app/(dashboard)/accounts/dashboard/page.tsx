'use client';

import { useState, useEffect } from 'react';
import {OperationalExpense, OperationalExpenseFilters} from '@/state';
import {useGetOperationalExpensesQuery} from "@/state/api";
import SummaryCards from "@/app/(dashboard)/admin/dashboard/components/SummaryCards";
import ExpensePieChart from "@/app/(dashboard)/admin/dashboard/components/ExpensePieChart";
import TrendLineChart from "@/app/(dashboard)/admin/dashboard/components/TrendLineChart";
import RecentTransactions from "@/app/(dashboard)/admin/dashboard/components/RecentTransactions";

export default function Dashboard() {
    const [expenses, setExpenses] = useState<OperationalExpense[]>([]);
    const [filters, setFilters] = useState<OperationalExpenseFilters>({
        page: 1,
        limit: 50,
        includeDrafts: false,
    });
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [timeFrame, setTimeFrame] = useState<'day' | 'week' | 'month'>('month');

    const { data, isLoading, error } = useGetOperationalExpensesQuery(filters);

    useEffect(() => {
        if (data?.expenses) {
            setExpenses(data.expenses);
        }
    }, [data]);

    const handleCategorySelect = (category: string) => {
        setSelectedCategory(category);
    };

    const handleTimeFrameChange = (timeFrame: 'day' | 'week' | 'month') => {
        setTimeFrame(timeFrame);
    };

    const handleApprove = async (id: number) => {
        // Implement approve logic (e.g., call mutation)
        // console.log('Approve expense:', id);
    };

    const handleEdit = (expense: OperationalExpense) => {
        // Implement edit logic (e.g., open ExpenseForm)
        // console.log('Edit expense:', expense);
    };

    const handleView = (expense: OperationalExpense) => {
        // Implement view logic (e.g., open ExpenseDetails)
        // console.log('View expense:', expense);
    };

    return (
        <div className="container mx-auto p-6 flex flex-col gap-6 min-h-screen bg-gray-100">
            <h1 className="text-3xl font-bold text-gray-800">Operational Expenses Dashboard</h1>
            {isLoading && <p className="text-gray-500">Loading...</p>}
            {error && <p className="text-red-600">Error loading expenses</p>}
            <SummaryCards expenses={expenses} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ExpensePieChart expenses={expenses} onCategorySelect={handleCategorySelect} />
                <TrendLineChart expenses={expenses} timeFrame={timeFrame} onTimeFrameChange={handleTimeFrameChange} />
            </div>
            <RecentTransactions
                expenses={expenses}
                selectedCategory={selectedCategory}
                onApprove={handleApprove}
                onEdit={handleEdit}
                onView={handleView}
            />
        </div>
    );
}