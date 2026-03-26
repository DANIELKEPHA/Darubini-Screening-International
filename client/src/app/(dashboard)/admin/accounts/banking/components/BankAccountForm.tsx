'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateBankAccountMutation, useUpdateBankAccountMutation } from '@/state/api';
import { BankAccount } from '@/state';
import { withToast } from '@/lib/utils';

interface BankAccountFormProps {
    account?: BankAccount | null;
    onClose: () => void;
}

export default function BankAccountForm({ account, onClose }: BankAccountFormProps) {
    const router = useRouter();
    const isEditing = !!account;

    // ✅ include accountName and ensure balance is a string
    const [formData, setFormData] = useState({
        bankName: account?.bankName || '',
        accountNumber: account?.accountNumber || '',
        accountName: account?.accountName || '',
        currency: account?.currency || 'KES',
        balance: account?.balance || '0',
    });

    const [createBankAccount, { isLoading: isCreating }] = useCreateBankAccountMutation();
    const [updateBankAccount, { isLoading: isUpdating }] = useUpdateBankAccountMutation();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && account?.id) {
                await withToast(
                    updateBankAccount({ id: account.id, ...formData, balance: String(formData.balance) }).unwrap(),
                    { success: 'Account updated', error: 'Failed to update account' }
                );
            } else {
                await withToast(
                    createBankAccount({ ...formData, balance: String(formData.balance) }).unwrap(),
                    { success: 'Account added successfully', error: 'Failed to add account' }
                );
            }
            onClose();
        } catch {
            // Error toast handled by withToast
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            // ✅ always keep balance as a string
            [name]: name === 'balance' ? value : value,
        });
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6">
                <button
                    onClick={() => router.push('/admin/banking')}
                    className="mb-4 text-blue-600 hover:underline"
                >
                    &larr; Back
                </button>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {isEditing ? 'Edit Bank Account' : 'Connect Bank Account Manually'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                        <input
                            type="text"
                            name="bankName"
                            value={formData.bankName}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border border-gray-200 py-2.5 px-4 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500"
                            required
                            maxLength={100}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Account Number</label>
                        <input
                            type="text"
                            name="accountNumber"
                            value={formData.accountNumber}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border border-gray-200 py-2.5 px-4 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500"
                            required
                            maxLength={50}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Account Name</label>
                        <input
                            type="text"
                            name="accountName"
                            value={formData.accountName}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border border-gray-200 py-2.5 px-4 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500"
                            required
                            maxLength={100}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Currency</label>
                        <select
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border border-gray-200 py-2.5 px-4 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="KES">KES</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Initial Balance</label>
                        <input
                            type="number"
                            name="balance"
                            value={formData.balance}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border border-gray-200 py-2.5 px-4 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500"
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            disabled={isCreating || isUpdating}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            disabled={isCreating || isUpdating}
                        >
                            {isEditing ? 'Update' : 'Add Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
