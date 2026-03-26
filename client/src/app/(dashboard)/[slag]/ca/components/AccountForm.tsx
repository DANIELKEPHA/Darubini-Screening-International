// app/(dashboard)/[slag]/ca/components/AccountForm.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useGetCurrenciesQuery } from '@/state/api';
import { CashAccount, Currency } from '@/state';
import { getErrorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { toast } from "sonner";

interface AccountFormProps {
    account: CashAccount | null;
    onSubmit: (formData: {
        name: string;
        currency: string;
        balance: number;
        description?: string;
    }) => void;
    onClose: () => void;
}

export default function AccountForm({
                                        account,
                                        onSubmit,
                                        onClose,
                                    }: AccountFormProps) {
    const isEditing = !!account;

    const [formData, setFormData] = useState({
        name: account?.accountName || '',
        currency: account?.currency || 'KES',
        balance: account?.balance ? Number(account.balance) : 0,
        description: account?.description || '',
    });

    const { data: currencies, isLoading, error } = useGetCurrenciesQuery();

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        // For editing, we don't need to validate balance
        // For creating, ensure balance is a valid number
        const balanceToSend = Number(formData.balance);
        if (!isEditing && (isNaN(balanceToSend) || balanceToSend < 0)) {
            toast.error("Balance must be a non-negative number");
            return;
        }

        onSubmit({
            name: formData.name.trim(),
            currency: formData.currency,
            balance: isEditing ? Number(account?.balance || 0) : balanceToSend,
            description: formData.description.trim() || undefined,
        });
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'balance' ? Number(value) || 0 : value,
        }));
    };

    const handleCurrencyChange = (value: string) => {
        setFormData((prev) => ({ ...prev, currency: value }));
    };

    return (
        <div className="flex h-full flex-col bg-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-5">
                <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                    {isEditing ? 'Edit Account' : 'Create New Account'}
                </h2>
                <button
                    onClick={onClose}
                    className="rounded-full p-2 hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                >
                    <X className="h-5 w-5 text-gray-500" />
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                    {/* Account Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Account Name</Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. M-Pesa Wallet, Office Cash, Emergency Fund"
                            required
                            autoFocus
                        />
                    </div>

                    {/* Currency */}
                    <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        {isLoading ? (
                            <div className="h-10 rounded-md border bg-gray-50 animate-pulse" />
                        ) : error ? (
                            <p className="text-sm text-red-600">{getErrorMessage(error)}</p>
                        ) : (
                            <Select
                                value={formData.currency}
                                onValueChange={handleCurrencyChange}
                                disabled={isEditing}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(currencies || []).map((c: Currency) => (
                                        <SelectItem key={c.code} value={c.code}>
                                            {c.name} ({c.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {isEditing && (
                            <p className="text-xs text-gray-500 italic">
                                Currency cannot be changed after the account is created.
                            </p>
                        )}
                    </div>

                    {/* Balance - only on create */}
                    {!isEditing && (
                        <div className="space-y-2">
                            <Label htmlFor="balance">Balance</Label>
                            <Input
                                id="balance"
                                name="balance"
                                type="number"
                                min={0}
                                step="0.01"
                                value={formData.balance}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="font-mono"
                            />
                            <p className="text-xs text-gray-500">
                                Enter initial balance for this account
                            </p>
                        </div>
                    )}

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Account Details</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Purpose of this account, notes, etc..."
                            rows={3}
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t bg-gray-50/70 px-6 py-5">
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 sm:w-auto"
                            disabled={!formData.name.trim() || isLoading}
                        >
                            {isEditing ? 'Update Account' : 'Create Account'}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}