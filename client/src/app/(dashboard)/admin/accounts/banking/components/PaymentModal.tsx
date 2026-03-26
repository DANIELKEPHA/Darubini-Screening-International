'use client';

import { useState, FormEvent } from 'react';
import { useInitiatePaymentMutation, useGetBankAccountsQuery } from '@/state/api';
import { Transaction } from '@/state';
import { withToast } from '@/lib/utils';

interface PaymentModalProps {
    transaction?: Transaction | null;
    onClose: () => void;
}

export default function PaymentModal({ transaction, onClose }: PaymentModalProps) {
    const [paymentData, setPaymentData] = useState<{
        amount: number;
        currency: string;
        paymentMode: 'BANK_DEPOSIT' | 'VISA_CARD';
        payee: string;
        bankAccountId: number;
        expenseId?: number;
        transactionId?: number;
    }>({
        amount: transaction ? Number(transaction.amount) : 0,
        currency: transaction?.currency || 'KES',
        paymentMode: 'BANK_DEPOSIT',
        payee: transaction?.payee || '',
        bankAccountId: transaction?.bankAccountId || 0,
        expenseId: transaction?.expenseId ?? undefined,
        transactionId: transaction?.id,
    });

    const [initiatePayment, { isLoading }] = useInitiatePaymentMutation();
    const { data: bankAccounts, isLoading: isLoadingAccounts, error: bankAccountsError } =
        useGetBankAccountsQuery({ page: 1, limit: 10 });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const { paymentUrl } = await withToast(
                initiatePayment({
                    ...paymentData,
                    // Ensure these are included as per Pesapal API requirements
                    callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payments/callback`, // Your callback URL
                    notification_id: process.env.PESAPAL_NOTIFICATION_ID, // From your .env
                }).unwrap(),
                { success: 'Payment initiated successfully. Redirecting...', error: 'Failed to initiate payment' }
            );
            // Redirect to Pesapal payment page
            window.location.href = paymentUrl;
        } catch (err) {
            // Error toast handled by withToast
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPaymentData({
            ...paymentData,
            [name]: name === 'amount' || name === 'bankAccountId' || name === 'expenseId' || name === 'transactionId'
                ? Number(value) || undefined
                : value,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Initiate Payment</h2>
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
                        <label className="block text-sm font-medium text-gray-700">Currency</label>
                        <select
                            name="currency"
                            value={paymentData.currency}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border border-gray-200 py-2.5 px-4 text-sm"
                            required
                        >
                            <option value="KES">KES</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Payee</label>
                        <input
                            type="text"
                            name="payee"
                            value={paymentData.payee}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border border-gray-200 py-2.5 px-4 text-sm"
                            required
                            maxLength={100}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Payment Mode</label>
                        <select
                            name="paymentMode"
                            value={paymentData.paymentMode}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border border-gray-200 py-2.5 px-4 text-sm"
                            required
                        >
                            <option value="BANK_DEPOSIT">Bank Deposit</option>
                            <option value="VISA_CARD">Visa Card</option>
                        </select>
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Expense ID (Optional)</label>
                        <input
                            type="number"
                            name="expenseId"
                            value={paymentData.expenseId || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border border-gray-200 py-2.5 px-4 text-sm"
                            placeholder="Enter Expense ID"
                        />
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            disabled={isLoading || isLoadingAccounts || !!bankAccountsError}
                        >
                            {isLoading ? 'Processing...' : 'Pay with Pesapal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}