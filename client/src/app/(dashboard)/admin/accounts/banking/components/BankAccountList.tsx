'use client';

import { useGetBankAccountsQuery } from '@/state/api';
import { BankAccount } from '@/state';

interface BankAccountListProps {
    onSelect: (account: BankAccount) => void;
    selectedAccountId?: number;
}

export default function BankAccountList({ onSelect, selectedAccountId }: BankAccountListProps) {
    // ✅ must pass at least {} because query args are defined
    const { data, isLoading, error } = useGetBankAccountsQuery({ page: 1, limit: 10 });

    return (
        <div className="mt-4">
            {isLoading && <p className="text-gray-500">Loading...</p>}
            {error && <p className="text-red-600">{(error as any).data?.message || 'Error loading accounts'}</p>}

            {data && data.length === 0 && (
                <p className="text-gray-500">No accounts found</p>
            )}

            {data && data.length > 0 && (
                <div className="space-y-2">
                    {data.map((account: BankAccount) => (
                        <div
                            key={account.id}
                            className={`p-3 rounded-md cursor-pointer hover:bg-blue-50 transition-colors ${
                                selectedAccountId === account.id
                                    ? 'bg-blue-100 border-l-4 border-blue-600'
                                    : 'bg-white'
                            }`}
                            onClick={() => onSelect(account)}
                        >
                            <p className="font-medium text-gray-800">{account.bankName}</p>
                            <p className="text-sm text-gray-500">
                                {account.accountNumber} • {account.currency}
                            </p>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}
