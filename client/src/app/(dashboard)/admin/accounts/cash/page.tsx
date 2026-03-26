'use client';

import { useState, useEffect } from 'react';
import {
    useGetCashAccountsQuery, useCreateCashAccountMutation, useDepositToCashAccountMutation,
    useDeleteCashAccountMutation
} from '@/state/api';
import { CashAccount } from '@/state';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, getErrorMessage } from '@/lib/utils';
import AccountForm from '@/app/(dashboard)/[slag]/ca/components/AccountForm';
import { DepositDialog } from '@/app/(dashboard)/[slag]/ca/components/DepositDialog';
import { AccountDetailsPanel } from '@/app/(dashboard)/[slag]/ca/components/AccountDetailsPanel';
import { ChevronDown, Plus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function CashAccountPage() {
    const [selectedAccount, setSelectedAccount] = useState<CashAccount | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isDepositOpen, setIsDepositOpen] = useState(false);

    const { data: accountsData, isLoading, error, refetch } = useGetCashAccountsQuery({
        limit: 100,
    });

    const [isEditing, setIsEditing] = useState(false);

    const [deleteCashAccount, { isLoading: isDeleting }] = useDeleteCashAccountMutation();

    const handleDelete = async (id: number) => {
        // Ask for confirmation and reason
        const reason = window.prompt("Why are you deleting this account?", "");
        if (!reason) {
            toast.error("Deletion cancelled: reason is required");
            return;
        }

        try {
            await deleteCashAccount({ id, reason }).unwrap(); // RTK Query returns a Promise with unwrap()
            // No need to manually remove from state; your mutation has optimistic update
            // Success toast already in onQueryStarted, but you can add additional here if needed
        } catch (error: any) {
            console.error("Delete cash account failed", error);
            toast.error(error.data?.message || "Failed to delete account");
        }
    };

    const [createCashAccount] = useCreateCashAccountMutation();
    const [depositToCashAccount, { isLoading: isDepositing }] = useDepositToCashAccountMutation();

    const accounts = accountsData?.accounts || [];
    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);
    const baseCurrency = accounts[0]?.currency || 'Ksh';

    // Auto-select first account when accounts load and no account is selected
    useEffect(() => {
        if (accounts.length > 0 && !selectedAccount && !isCreating) {
            setSelectedAccount(accounts[0]);
        }
    }, [accounts, selectedAccount, isCreating]);

    // Refresh selected account data when accounts update
    useEffect(() => {
        if (selectedAccount && accounts.length > 0) {
            const updatedAccount = accounts.find(acc => acc.id === selectedAccount.id);
            if (updatedAccount) {
                setSelectedAccount(updatedAccount);
            }
        }
    }, [accounts, selectedAccount]);

    const handleCreateAccount = async (formData: { name: string; currency: string; balance: number; description?: string; }) => {
        try {
            await createCashAccount(formData).unwrap();
            toast.success('Cash account created successfully');
            setIsCreating(false);
            refetch();
        } catch (error: any) {
            toast.error(getErrorMessage(error));
        }
    };

    const handleDeposit = async (amount: number, description?: string) => {
        if (!selectedAccount) return;

        try {
            await depositToCashAccount({
                id: selectedAccount.id,
                amount,
                description,
            }).unwrap();
            toast.success(`Deposited ${formatCurrency(amount, selectedAccount.currency || 'Ksh')}`);
            setIsDepositOpen(false);
            refetch();
        } catch (error: any) {
            toast.error(getErrorMessage(error));
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen bg-gray-50">
                <div className="flex h-full flex-col">
                    <div className="border-b bg-white px-6 py-4">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="mt-2 h-4 w-64" />
                    </div>
                    <div className="flex-1 p-6">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="mt-6 h-[calc(100vh-280px)] w-full rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen bg-gray-50">
                <div className="flex h-full items-center justify-center">
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                        <p className="text-red-700">{getErrorMessage(error)}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-50 flex flex-col">
            {/* Header Section - No margins */}
            <div className="border-b bg-white px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Cash Accounts</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage and track all your cash accounts
                        </p>
                    </div>
                    <div className="relative">
                        <Button
                            onClick={() => setIsCreating(true)}
                            className="h-10 w-10 rounded-full bg-blue-600 p-0 hover:bg-blue-700 hover:scale-105 transition-all duration-200 group"
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                        {/* Tooltip on hover */}
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 pointer-events-none transition-opacity group-hover:opacity-100">
              Create a new account
            </span>
                    </div>
                </div>
            </div>

            {/* Total Balance Bar */}
            <div className="bg-white px-6 py-4 shadow-sm border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-3">
                        <span className="text-sm font-medium text-gray-500">Total Balance:</span>
                        <span className="text-3xl font-bold text-gray-900">
              {formatCurrency(totalBalance, baseCurrency)}
            </span>
                    </div>

                    {/* Account Selector Dropdown */}
                    {accounts.length > 0 && selectedAccount && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex items-center gap-2">
                                    <span className="font-medium">{selectedAccount.accountName}</span>
                                    <span className="text-sm text-gray-500">
                    ({formatCurrency(Number(selectedAccount.balance), selectedAccount.currency)})
                  </span>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80">
                                {accounts.map((account) => (
                                    <DropdownMenuItem
                                        key={account.id}
                                        onClick={() => setSelectedAccount(account)}
                                        className={`flex items-center justify-between p-3 cursor-pointer ${
                                            selectedAccount?.id === account.id ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">{account.accountName}</span>
                                            {account.description && (
                                                <span className="text-xs text-gray-500">{account.description}</span>
                                            )}
                                        </div>
                                        <span className="font-semibold">
                      {formatCurrency(Number(account.balance), account.currency)}
                    </span>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuItem
                                    onClick={() => setIsCreating(true)}
                                    className="border-t p-3 text-blue-600"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create New Account
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* Selected Account Details - Full remaining space */}
            <div className="flex-1 overflow-auto">
                {selectedAccount ? (
                    <AccountDetailsPanel
                        account={selectedAccount}
                        onDeposit={() => setIsDepositOpen(true)}
                        isDepositing={isDepositing}
                        onEdit={() => setIsEditing(true)}
                        onDelete={() => handleDelete(selectedAccount.id)}
                    />
                ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                        <div className="rounded-full bg-gray-100 p-4">
                            <Plus className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No Accounts Found</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Create your first cash account to get started
                        </p>
                        <Button onClick={() => setIsCreating(true)} className="mt-6">
                            Create New Account
                        </Button>
                    </div>
                )}
            </div>

            {/* Full-Page Sidebar Form - Slides from left */}
            <div
                className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
                    isCreating ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <AccountForm
                    account={null}
                    onSubmit={handleCreateAccount}
                    onClose={() => setIsCreating(false)}
                />
            </div>

            {/* Overlay when sidebar is open */}
            {isCreating && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setIsCreating(false)}
                />
            )}

            {selectedAccount && (
                <DepositDialog
                    open={isDepositOpen}
                    onOpenChange={setIsDepositOpen}
                    account={selectedAccount}
                    onSubmit={handleDeposit}
                    isLoading={isDepositing}
                />
            )}
        </div>
    );
}