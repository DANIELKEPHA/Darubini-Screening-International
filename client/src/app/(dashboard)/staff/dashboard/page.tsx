'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGetOperationalExpensesQuery } from '@/state/api';
import {
    useGetAttendanceSummaryQuery,
    useGetAttendanceTrendsQuery,
    useGetLateCheckInsQuery,
    useGetAutoCheckoutReportQuery,
    useGetBreakAnalyticsQuery,
    useGetUserActivityStatusQuery,
    useGenerateAttendanceReportQuery,
    useGetAuthUserQuery,
} from '@/state/api';
import { OperationalExpense, AttendanceReportRecord } from '@/state';
import SummaryCards from '@/app/(dashboard)/admin/dashboard/components/SummaryCards';
import TrendLineChart from '@/app/(dashboard)/admin/dashboard/components/TrendLineChart';
import RecentTransactions from '@/app/(dashboard)/admin/dashboard/components/RecentTransactions';
import ExpensePieChart from '@/app/(dashboard)/admin/dashboard/components/ExpensePieChart';
import AttendanceSummaryCards from '@/app/(dashboard)/admin/dashboard/stats/AttendanceSummaryCards';
import AttendanceTrendChart from '@/app/(dashboard)/admin/dashboard/stats/AttendanceTrendChart';
import AttendancePieChart from '@/app/(dashboard)/admin/dashboard/stats/AttendancePieChart';
import UserActivityStatusChart from '@/app/(dashboard)/admin/dashboard/stats/UserActivityStatusChart';
import LateCheckInsCard from '@/app/(dashboard)/admin/dashboard/stats/LateCheckInsCard';
import AutoCheckoutsCard from '@/app/(dashboard)/admin/dashboard/stats/AutoCheckoutsCard';
import AttendanceReportTable from '@/app/(dashboard)/admin/dashboard/stats/AttendanceReportTable';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
    const [expenses, setExpenses] = useState<OperationalExpense[]>([]);
    const [expenseTimeFrame, setExpenseTimeFrame] = useState<'day' | 'week' | 'month'>('month');
    const [timeFrame, setTimeFrame] = useState<'day' | 'week' | 'month'>('month');

    const { data: expenseData, isLoading: isExpenseLoading, error: expenseError } = useGetOperationalExpensesQuery({
        page: 1,
        limit: 100,
        includeDrafts: false,
    });

    const { data: authUser, isLoading: isAuthLoading } = useGetAuthUserQuery();
    const { data: summaryData, isLoading: isSummaryLoading, error: summaryError } = useGetAttendanceSummaryQuery();
    const { data: trendsData, isLoading: isTrendsLoading, error: trendsError } = useGetAttendanceTrendsQuery({ timeFrame });
    const { data: lateCheckInsData, isLoading: isLateCheckInsLoading, error: lateCheckInsError } = useGetLateCheckInsQuery();
    const { data: autoCheckoutsData, isLoading: isAutoCheckoutsLoading, error: autoCheckoutsError } = useGetAutoCheckoutReportQuery();
    const { data: breakAnalyticsData, isLoading: isBreakAnalyticsLoading, error: breakAnalyticsError } = useGetBreakAnalyticsQuery();
    const { data: userActivityData, isLoading: isUserActivityLoading, error: userActivityError } = useGetUserActivityStatusQuery();
    const { data: reportData, isLoading: isReportLoading, error: reportError } = useGenerateAttendanceReportQuery({ timeFrame });

    useEffect(() => {
        if (expenseData?.expenses) setExpenses(expenseData.expenses);
    }, [expenseData]);

    useEffect(() => {
        if (summaryError) toast.error('Failed to load attendance summary');
        if (trendsError) toast.error('Failed to load attendance trends');
        if (lateCheckInsError) toast.error('Failed to load late check-ins');
        if (autoCheckoutsError) toast.error('Failed to load auto-checkout report');
        if (breakAnalyticsError) toast.error('Failed to load break analytics');
        if (userActivityError) toast.error('Failed to load user activity status');
        if (reportError) toast.error('Failed to load attendance report');
    }, [summaryError, trendsError, lateCheckInsError, autoCheckoutsError, breakAnalyticsError, userActivityError, reportError]);

    const handleExpenseTimeFrameChange = (timeFrame: 'day' | 'week' | 'month') => setExpenseTimeFrame(timeFrame);
    const handleTimeFrameChange = (newTimeFrame: 'day' | 'week' | 'month') => setTimeFrame(newTimeFrame);

    return (
        <motion.div
            className="container mx-auto p-4 sm:p-6 flex flex-col gap-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 font-geist"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
        >
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary-500" />
                Enterprise Dashboard
            </h1>

            {/* Operational Expenses Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-6"
            >
                {isExpenseLoading && <p className="text-gray-500 text-center">Loading expenses...</p>}
                {expenseError && <p className="text-red-600 text-center">Error loading expenses</p>}
                <SummaryCards expenses={expenses} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ExpensePieChart expenses={expenses} onCategorySelect={() => {}} />
                    <TrendLineChart expenses={expenses} timeFrame={expenseTimeFrame} onTimeFrameChange={handleExpenseTimeFrameChange} />
                </div>
                <RecentTransactions
                    expenses={expenses}
                    selectedCategory={null}
                    onApprove={() => {}}
                    onEdit={() => {}}
                    onView={() => {}}
                />
            </motion.section>

            {/* Attendance Metrics Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="space-y-6"
            >
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200">Attendance Metrics</h2>
                {isSummaryLoading && <p className="text-gray-500 text-center">Loading attendance summary...</p>}
                {summaryData && <AttendanceSummaryCards summary={summaryData} />}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {isBreakAnalyticsLoading ? (
                        <p className="text-gray-500 text-center">Loading break analytics...</p>
                    ) : breakAnalyticsData && (
                        <AttendancePieChart analytics={breakAnalyticsData} />
                    )}
                    {isTrendsLoading ? (
                        <p className="text-gray-500 text-center">Loading trends...</p>
                    ) : trendsData && (
                        <AttendanceTrendChart trends={trendsData} timeFrame={timeFrame} onTimeFrameChange={handleTimeFrameChange} />
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {isLateCheckInsLoading ? (
                        <p className="text-gray-500 text-center">Loading late check-ins...</p>
                    ) : lateCheckInsData && (
                        <LateCheckInsCard count={lateCheckInsData.lateCheckIns} />
                    )}
                    {isAutoCheckoutsLoading ? (
                        <p className="text-gray-500 text-center">Loading auto-checkouts...</p>
                    ) : autoCheckoutsData && (
                        <AutoCheckoutsCard count={autoCheckoutsData.autoCheckouts} />
                    )}
                </div>
                {isUserActivityLoading ? (
                    <p className="text-gray-500 text-center">Loading user activity status...</p>
                ) : userActivityData && (
                    <UserActivityStatusChart status={userActivityData} />
                )}
                {isReportLoading ? (
                    <p className="text-gray-500 text-center">Loading attendance report...</p>
                ) : reportData && (
                    <AttendanceReportTable report={reportData.report} timeFrame={timeFrame} onTimeFrameChange={handleTimeFrameChange} />
                )}
            </motion.section>
        </motion.div>
    );
}