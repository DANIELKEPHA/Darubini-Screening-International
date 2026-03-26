'use client';

import { useRouter } from 'next/navigation';
import { useGetBankAccountsQuery } from '@/state/api';
import { BankAccount } from '@/state';
import { useState, useEffect } from 'react';

export default function BankingLanding() {
    const router = useRouter();
    const { data: bankAccounts, isLoading, error } = useGetBankAccountsQuery({
        page: 1,
        limit: 20,
    });

    const [showAnimation, setShowAnimation] = useState(false);

    useEffect(() => {
        setShowAnimation(true);
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-primary-50 p-6">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                    <p className="text-primary-700">Loading your banking information...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-primary-50 p-6">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center border border-primary-100">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-primary-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            ></path>
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-primary-800 mb-2">Connection Error</h2>
                    <p className="text-primary-700 mb-6">
                        {(error as any).data?.message || 'Unable to load bank accounts. Please try again.'}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const hasAccounts = Array.isArray(bankAccounts) && bankAccounts.length > 0;
    const totalBalance = hasAccounts
        ? bankAccounts.reduce(
            (sum: number, account: BankAccount) => sum + Number(account.balance),
            0
        )
        : 0;


    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-8 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            ></path>
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-primary-800 mb-2">Bank Account Management</h1>
                    <p className="text-primary-700">
                        Securely connect and manage your business banking accounts
                    </p>
                </div>

                {/* Account Summary */}
                {hasAccounts && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-primary-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-primary-800">Account Summary</h2>
                            <span className="text-sm text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                                {bankAccounts.length} account{bankAccounts.length > 1 ? 's' : ''}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-primary-50 rounded-lg p-4 text-center">
                                <p className="text-sm text-primary-600 mb-1">Total Balance</p>
                                <p className="text-2xl font-bold text-primary-800">
                                    {bankAccounts[0]?.currency} {totalBalance.toFixed(2)}
                                </p>
                            </div>
                            <div className="bg-primary-50 rounded-lg p-4 text-center">
                                <p className="text-sm text-primary-600 mb-1">Connected Banks</p>
                                <p className="text-2xl font-bold text-primary-800">
                                    {new Set(bankAccounts.map((acc: BankAccount) => acc.bankName)).size}
                                </p>
                            </div>
                            <div className="bg-primary-50 rounded-lg p-4 text-center">
                                <p className="text-sm text-primary-600 mb-1">Currency Types</p>
                                <p className="text-2xl font-bold text-primary-800">
                                    {new Set(bankAccounts.map((acc: BankAccount) => acc.currency)).size}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-primary-800 mb-4">Connected Accounts</h3>
                            {bankAccounts.map((account: BankAccount) => (
                                <div
                                    key={account.id}
                                    className="flex justify-between items-center p-4 bg-primary-50 rounded-lg border border-primary-200 hover:bg-primary-100 transition-colors"
                                >
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-primary-200 rounded-lg flex items-center justify-center mr-4">
                                            <svg
                                                className="w-5 h-5 text-primary-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-8 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                                ></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-primary-900 font-medium">{account.bankName}</p>
                                            <p className="text-sm text-primary-600">{account.accountNumber}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-primary-800 font-semibold">
                                            {account.currency} {Number(account.balance).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-center mt-6">
                            <button
                                onClick={() => router.push('/admin/banking/dashboard')}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                Manage Accounts
                            </button>
                        </div>
                    </div>
                )}

                {/* Connection Options */}
                <div className="bg-white rounded-xl shadow-lg p-8 border border-primary-100">
                    <h2 className="text-2xl font-bold text-primary-800 mb-6 text-center">
                        {hasAccounts ? 'Add Another Account' : 'Connect Your First Account'}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Automated Connection */}
                        <div className="border border-primary-200 rounded-lg p-6 hover:border-primary-400 transition-colors">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg
                                        className="w-5 h-5 text-primary-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                        ></path>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-primary-800">Automatic Connection</h3>
                            </div>
                            <p className="text-primary-700 mb-4">
                                Securely connect to your bank using encrypted API integration for automatic transaction
                                updates.
                            </p>
                            <button
                                onClick={() => router.push('/admin/banking/connect-bank')}
                                className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                Connect Automatically
                            </button>
                        </div>

                        {/* Manual Connection */}
                        <div className="border border-primary-200 rounded-lg p-6 hover:border-primary-400 transition-colors">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                                    <svg
                                        className="w-5 h-5 text-primary-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        ></path>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-primary-800">Manual Setup</h3>
                            </div>
                            <p className="text-primary-700 mb-4">
                                Enter your bank account details manually if you prefer not to use automatic connection.
                            </p>
                            <button
                                onClick={() => router.push('/admin/banking/connect-manually')}
                                className="w-full px-4 py-3 bg-white border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors"
                            >
                                Connect Manually
                            </button>
                        </div>
                    </div>

                    {/* Skip Option */}
                    {!hasAccounts && (
                        <div className="text-center pt-4 border-t border-primary-100">
                            <button
                                onClick={() => router.push('/admin/banking/dashboard')}
                                className="text-primary-600 hover:text-primary-800 transition-colors"
                            >
                                Skip for now
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
