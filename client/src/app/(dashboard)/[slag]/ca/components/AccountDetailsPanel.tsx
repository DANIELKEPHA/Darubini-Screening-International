'use client';

import React, { useMemo } from 'react';
import { useGetTransactionsQuery } from '@/state/api';
import {
    useGetOperationalExpensesQuery,
    useGetClientExpensesQuery,
} from '@/state/api';

import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Edit,
    Trash2,
    ArrowDownToLine,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Tag,
    Info,
    CreditCard,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { CashAccount } from '@/state';
import MonthlyCashFlowChart from "@/app/(dashboard)/[slag]/ca/components/MonthlyCashFlowChart";
import AccountManagementPanel from "@/app/(dashboard)/[slag]/ca/components/AccountManagementPanel";

interface AccountDetailsPanelProps {
    account: CashAccount;
    onEdit: () => void;
    onDelete: () => void;
    onDeposit: () => void;
    isDepositing: boolean;
}

// Unified transaction type for display
interface UnifiedTransaction {
    id: string;
    amount: number;
    description: string;
    createdAt: string;
    currency?: string;
    status?: string;
    type?: 'transaction' | 'operational' | 'client';
    paymentMode?: string;
    checkoutRequestId?: string;
}

export function AccountDetailsPanel({
                                        account,
                                        onEdit,
                                        onDelete,
                                        onDeposit,
                                        isDepositing,
                                    }: AccountDetailsPanelProps) {
    // 1. Cash/Bank/Mobile Transactions
    const { data: transactionsData, isLoading: transactionsLoading } =
        useGetTransactionsQuery({
            cashAccountId: account.id,
            limit: 50,
        });

    // 2. Operational Expenses
    const { data: opData, isLoading: opLoading } = useGetOperationalExpensesQuery({
        page: 1,
        limit: 200,
    });

    // 3. Client Expenses
    const { data: clientData, isLoading: clientLoading } = useGetClientExpensesQuery({
        page: 1,
        limit: 200,
        tab: 'approved',
    });

    const isLoading = transactionsLoading || opLoading || clientLoading;

    // Combine all sources into one unified list for Transaction History
    const allTransactions: UnifiedTransaction[] = [
        // Original transactions
        ...(transactionsData?.transactions || []).map((t: any) => ({
            id: t.id,
            amount: Number(t.amount || 0),
            description: t.description || 'Transaction',
            createdAt: t.createdAt,
            currency: t.currency || account.currency,
            status: t.status,
            type: 'transaction' as const,
            checkoutRequestId: t.checkoutRequestId,
            paymentMode: t.paymentMode,
        })),

        // Operational Expenses (treated as negative/outflow)
        ...(opData?.expenses || []).map((exp: any) => ({
            id: `op-${exp.id}`,
            amount: -Math.abs(Number(exp.amount || 0)),
            description: exp.expenseName || exp.expenseDescription || 'Operational Expense',
            createdAt: exp.createdAt || exp.date || exp.paymentDate,
            currency: exp.currency || account.currency,
            status: exp.status || 'completed',
            type: 'operational' as const,
            paymentMode: exp.paymentMode,
        })),

        // Client Expenses (treated as negative/outflow)
        ...(clientData?.expenses || []).map((exp: any) => ({
            id: `client-${exp.id}`,
            amount: -Math.abs(Number(exp.amount || 0)),
            description: exp.expenseCheck || exp.description || 'Client Expense',
            createdAt: exp.createdAt || exp.date,
            currency: exp.currency || account.currency,
            status: exp.status || 'approved',
            type: 'client' as const,
            paymentMode: exp.paymentMode,
        })),
    ]
        // Sort by date (newest first)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 100);

    // === Monthly Statistics Data for Chart ===
    const chartData = useMemo(() => {
        const now = new Date();
        const monthsToShow = 12;
        const dataMap = new Map<string, { inflows: number; expenses: number }>();

        // Initialize last 12 months
        for (let i = monthsToShow - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = date.toISOString().slice(0, 7); // YYYY-MM
            dataMap.set(key, { inflows: 0, expenses: 0 });
        }

        // Process Transactions → Inflows (Deposits)
        (transactionsData?.transactions || []).forEach((tx: any) => {
            const amount = Number(tx.amount || 0);
            if (amount <= 0 || !tx.createdAt) return;

            const date = new Date(tx.createdAt);
            const key = date.toISOString().slice(0, 7);
            if (dataMap.has(key)) {
                dataMap.get(key)!.inflows += amount;
            }
        });

        // Process Operational + Client Expenses
        const allExpenses = [
            ...(opData?.expenses || []),
            ...(clientData?.expenses || []),
        ];

        allExpenses.forEach((exp: any) => {
            const amount = Math.abs(Number(exp.amount || 0));
            if (amount === 0) return;

            const date = new Date(exp.createdAt || exp.date || exp.paymentDate || Date.now());
            const key = date.toISOString().slice(0, 7);

            if (dataMap.has(key)) {
                dataMap.get(key)!.expenses += amount;
            }
        });

        // Convert to array for Recharts
        return Array.from(dataMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, values]) => {
                const date = new Date(key + '-01');
                const monthName = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear();

                return {
                    month: monthName,
                    Inflows: Math.round(values.inflows),
                    Expenses: Math.round(values.expenses),
                    Net: Math.round(values.inflows - values.expenses),
                };
            });
    }, [transactionsData, opData, clientData]);

    return (
        <div className="rounded-2xl border bg-white shadow-sm">
         {/* Account Header */}
            <div className="border-b bg-gradient-to-r from-blue-50 to-white p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {account.accountName || 'Unnamed Account'}
                            </h2>
                            {account.accountNumber && (
                                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {account.accountNumber}
                    </span>
                            )}
                        </div>

                        <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                    {formatCurrency(Number(account.balance), account.currency)}
                </span>
                            <span className="text-sm text-gray-500">{account.currency}</span>
                        </div>

                        {account.description && (
                            <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                                <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                <p>{account.description}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={onDeposit}
                            disabled={isDepositing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <ArrowDownToLine className="mr-2 h-4 w-4" />
                            Deposit
                        </Button>
                        <Button onClick={onEdit} variant="outline">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                        <Button onClick={onDelete} variant="destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
            {/* Main Tabs Section */}
            <div className="p-6">
                <Tabs defaultValue="transactions" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="transactions">Transaction History</TabsTrigger>
                        <TabsTrigger value="statistics">Statistics</TabsTrigger>
                        <TabsTrigger value="details">Account Details</TabsTrigger>
                    </TabsList>

                    {/* ==================== TRANSACTIONS TAB ==================== */}
                    <TabsContent value="transactions" className="mt-0">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                                ))}
                            </div>
                        ) : allTransactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="rounded-full bg-gray-100 p-4">
                                    <Calendar className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="mt-4 text-lg font-medium text-gray-900">No transactions yet</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Start by depositing funds into this account
                                </p>
                                <Button onClick={onDeposit} variant="outline" className="mt-4">
                                    Make a Deposit
                                </Button>
                            </div>
                        ) : (
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-3">
                                    {allTransactions.map((transaction) => {
                                        const amount = Number(transaction.amount || 0);
                                        const isDeposit = amount > 0;

                                        return (
                                            <div
                                                key={transaction.id}
                                                className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className={`rounded-full p-2 ${
                                                            isDeposit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                        }`}
                                                    >
                                                        {isDeposit ? (
                                                            <ArrowDownRight className="h-4 w-4" />
                                                        ) : (
                                                            <ArrowUpRight className="h-4 w-4" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {transaction.description}
                                                            {transaction.type === 'operational' && ' (Operational)'}
                                                            {transaction.type === 'client' && ' (Client)'}
                                                        </p>
                                                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                                                            <span>{formatDate(transaction.createdAt)}</span>
                                                            {transaction.paymentMode && (
                                                                <span className="flex items-center gap-1">
                                  <CreditCard className="h-3 w-3" />
                                                                    {transaction.paymentMode}
                                </span>
                                                            )}
                                                            {transaction.checkoutRequestId && (
                                                                <span className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                                                    {transaction.checkoutRequestId}
                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <p
                                                        className={`font-semibold ${
                                                            isDeposit ? 'text-green-600' : 'text-red-600'
                                                        }`}
                                                    >
                                                        {isDeposit ? '+' : '-'}
                                                        {formatCurrency(
                                                            Math.abs(amount),
                                                            transaction.currency || account.currency
                                                        )}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-400">{transaction.status}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        )}
                    </TabsContent>

                    {/* ==================== STATISTICS TAB ==================== */}
                    <TabsContent value="statistics" className="mt-0">
                        <MonthlyCashFlowChart
                            accountId={account.id}
                            currency={account.currency}
                            months={12}
                        />
                    </TabsContent>

                    {/* ==================== ACCOUNT DETAILS TAB ==================== */}
                    <TabsContent value="details" className="mt-0">
                        <AccountManagementPanel
                            account={account}
                            onEdit={onEdit}
                            onDeposit={onDeposit}
                            isDepositing={isDepositing}
                            currentUserRole="accounts"
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}