'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { useInitiatePaymentMutation, useGetBankAccountsQuery } from '@/state/api';
import { withToast } from '@/lib/utils';

export default function MockBankLogin() {
    const params = useParams();
    const dynamicBankName = (params?.bankName as string) || 'Unknown Bank';
    const router = useRouter();

    const [paymentData, setPaymentData] = useState({
        amount: 0,
        currency: 'KES',
        paymentMode: 'BANK_DEPOSIT' as const,
        payee: '',
        bankAccountId: 0,
    });
    const [initiatePayment, { isLoading }] = useInitiatePaymentMutation();
    const { data: bankAccounts, isLoading: isLoadingAccounts, error: bankAccountsError } =
        useGetBankAccountsQuery({ page: 1, limit: 100 });


    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const { paymentUrl } = await withToast(
                initiatePayment({
                    ...paymentData,
                    payee: paymentData.payee || `${dynamicBankName} Payment`,
                    callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payments/callback`,
                    notification_id: process.env.PESAPAL_NOTIFICATION_ID,
                }).unwrap(),
                { success: 'Payment initiated successfully. Redirecting...', error: 'Failed to initiate payment' }
            );
            window.location.href = paymentUrl;
        } catch {}
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPaymentData({
            ...paymentData,
            [name]: name === 'amount' || name === 'bankAccountId' ? Number(value) || 0 : value,
        });
    };

    if (!dynamicBankName) {
        return (
            <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Bank</h1>
                    <button
                        onClick={() => router.push('/admin/banking/connect-bank')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        ← Back to Banks
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6">
                <button
                    onClick={() => router.push('/admin/banking/connect-bank')}
                    className="mb-4 text-blue-600 hover:underline"
                >
                    ← Back
                </button>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    Pay with {dynamicBankName}
                </h1>
                <p className="text-gray-600 mb-4">
                    Initiate a payment using Pesapal. Enter the details below to proceed.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                        <input
                            type="number"
                            name="amount"
                            value={paymentData.amount}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border border-gray-200 py-2.5 px-4 text-sm"
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Payee</label>
                        <input
                            type="text"
                            name="payee"
                            value={paymentData.payee}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border border-gray-200 py-2.5 px-4 text-sm"
                            placeholder="Enter payee name"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Bank Account</label>
                        <select
                            name="bankAccountId"
                            value={paymentData.bankAccountId}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border border-gray-200 py-2.5 px-4 text-sm"
                            required
                            disabled={isLoadingAccounts || !!bankAccountsError}
                        >
                            <option value="">Select Bank Account</option>
                            {Array.isArray(bankAccounts) && bankAccounts.length > 0 ? (
                                bankAccounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.bankName} ({account.accountNumber})
                                    </option>
                                ))
                            ) : (
                                <option disabled>No bank accounts available</option>
                            )}
                        </select>
                        {bankAccountsError && (
                            <p className="text-red-600 text-sm mt-1">
                                Failed to load bank accounts: {(bankAccountsError as any).data?.message || 'Unknown error'}
                            </p>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        disabled={
                            isLoading ||
                            isLoadingAccounts ||
                            !!bankAccountsError ||
                            !paymentData.bankAccountId ||
                            !paymentData.amount
                        }
                    >
                        {isLoading ? 'Processing...' : 'Pay with Pesapal'}
                    </button>
                </form>
            </div>
        </div>
    );
}
