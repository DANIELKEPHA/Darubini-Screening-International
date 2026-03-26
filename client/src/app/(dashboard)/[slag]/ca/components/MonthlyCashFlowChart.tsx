'use client';

import React, { useMemo } from 'react';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    TooltipProps,
} from 'recharts';

import { useGetTransactionsQuery } from '@/state/api';
import { useGetOperationalExpensesQuery } from '@/state/api';
import { useGetClientExpensesQuery } from '@/state/api';

import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MonthlyCashFlowChartProps {
    accountId: number;
    currency?: string;
    months?: number;
}

export default function MonthlyCashFlowChart({
                                                 accountId,
                                                 currency = 'KSh',
                                                 months = 12,
                                             }: MonthlyCashFlowChartProps) {
    const { data: txData } = useGetTransactionsQuery({
        cashAccountId: accountId,
        limit: 500,
    });

    const { data: opData } = useGetOperationalExpensesQuery({
        page: 1,
        limit: 500,
        cashAccountId: accountId,
    });

    const { data: clientData } = useGetClientExpensesQuery({
        page: 1,
        limit: 500,
        tab: 'approved',
        cashAccountId: accountId,
    });

    // Process data into monthly aggregates with separate operational & client expenses
    const chartData = useMemo(() => {
        const dataMap = new Map<string, {
            inflows: number;
            operationalExpenses: number;
            clientExpenses: number;
        }>();

        // Helper to get YYYY-MM key safely
        const getMonthKey = (dateStr: string | undefined): string | null => {
            if (!dateStr) return null;
            try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return null;
                return date.toISOString().slice(0, 7); // YYYY-MM
            } catch {
                return null;
            }
        };

        // 1. Transactions → Inflows
        (txData?.transactions || []).forEach((tx: any) => {
            const key = getMonthKey(tx?.createdAt);
            if (!key) return;
            const amount = Number(tx.amount || 0);
            if (amount <= 0) return;

            if (!dataMap.has(key)) dataMap.set(key, { inflows: 0, operationalExpenses: 0, clientExpenses: 0 });
            dataMap.get(key)!.inflows += amount;
        });

        // 2. Operational Expenses
        (opData?.expenses || []).forEach((exp: any) => {
            const key = getMonthKey(exp?.createdAt || exp?.date || exp?.paymentDate);
            if (!key) return;
            const amount = Math.abs(Number(exp?.amount || 0));
            if (!amount) return;

            if (!dataMap.has(key)) dataMap.set(key, { inflows: 0, operationalExpenses: 0, clientExpenses: 0 });
            dataMap.get(key)!.operationalExpenses += amount;
        });

        // 3. Client Expenses
        (clientData?.expenses || []).forEach((exp: any) => {
            const key = getMonthKey(exp?.createdAt || exp?.date);
            if (!key) return;
            const amount = Math.abs(Number(exp?.amount || 0));
            if (!amount) return;

            if (!dataMap.has(key)) dataMap.set(key, { inflows: 0, operationalExpenses: 0, clientExpenses: 0 });
            dataMap.get(key)!.clientExpenses += amount;
        });

        // Convert to array and sort by date (this will include ALL months that have data)
        return Array.from(dataMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, values]) => {
                const date = new Date(key + '-01');
                const monthName = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear();

                const totalExpenses = values.operationalExpenses + values.clientExpenses;

                return {
                    month: monthName,
                    Inflows: Math.round(values.inflows),
                    Operational: Math.round(values.operationalExpenses),
                    Client: Math.round(values.clientExpenses),
                    Net: Math.round(values.inflows - totalExpenses),
                };
            });
    }, [txData, opData, clientData]);

    // Tooltip formatter
    const tooltipFormatter: TooltipProps<number, string>['formatter'] = (value, name) => {
        if (value === undefined || value === null) return ['-', String(name ?? '')];
        return [formatCurrency(Number(value), currency), String(name ?? '')];
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Monthly Cash Flow Breakdown</CardTitle>
                <CardDescription>
                    Inflows vs Operational Expenses vs Client Expenses — Last {months} months
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis
                                yAxisId="left"
                                tickFormatter={(value) => formatCurrency(value, currency).replace(currency, '')}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tickFormatter={(value) => formatCurrency(value, currency).replace(currency, '')}
                            />

                            <Tooltip formatter={tooltipFormatter} />
                            <Legend />

                            {/* Bars - Two separate expense bars */}
                            <Bar
                                yAxisId="left"
                                dataKey="Operational"
                                fill="#f97316"          // Orange for Operational
                                name="Operational Expenses"
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar
                                yAxisId="left"
                                dataKey="Client"
                                fill="#ef4444"           // Red for Client
                                name="Client Expenses"
                                radius={[4, 4, 0, 0]}
                            />

                            {/* Line - Inflows (Deposits) */}
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="Inflows"
                                stroke="#22c55e"
                                strokeWidth={4}
                                dot={{ r: 6, fill: '#22c55e' }}
                                name="Money In (Deposits)"
                            />

                            {/* Line - Net Flow */}
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="Net"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                strokeDasharray="5 5"
                                dot={{ r: 5 }}
                                name="Net Flow"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}