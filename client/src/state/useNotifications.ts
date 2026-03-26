'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetOperationalExpensesQuery } from '@/state/api';
import { OperationalExpense } from '@/state';
import { skipToken } from '@reduxjs/toolkit/query';

export const useNotifications = () => {
    const userRole = useSelector((state: any) => state.global.user?.role);
    const isRelevantRole = ['admin', 'accounts'].includes(userRole?.toLowerCase());
    const [notificationCount, setNotificationCount] = useState(0);
    const [lastChecked, setLastChecked] = useState(Date.now());

    const { data: expensesResponse, isSuccess } = useGetOperationalExpensesQuery(
        isRelevantRole
            ? { page: 1, limit: 100, includeDrafts: true }
            : skipToken,
        { pollingInterval: 30000 }
    );

    useEffect(() => {
        if (isRelevantRole && isSuccess && expensesResponse?.expenses) {
            const drafts = expensesResponse.expenses.filter(
                (expense: OperationalExpense) => expense.expenseStatus === 'DRAFT'
            );
            const newCount = drafts.length;
            setNotificationCount(newCount);
        }
    }, [expensesResponse, isRelevantRole, isSuccess]);

    const resetNotifications = () => {
        setNotificationCount(0);
        setLastChecked(Date.now());
    };

    return { notificationCount, resetNotifications };
};