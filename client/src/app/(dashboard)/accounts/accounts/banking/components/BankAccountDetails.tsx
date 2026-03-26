'use client';

import { useRouter } from 'next/navigation';
import { BankAccount } from '@/state';

interface BankAccountDetailsProps {
    account: BankAccount;
    onEdit: () => void;
    onClose: () => void;
}

export default function BankAccountDetails({ account, onEdit, onClose }: BankAccountDetailsProps) {
    return (
        <div className="p-6 bg-white rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{account.bankName}</h2>
                <div className="space-x-4">
                    <button
                        onClick={onEdit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Edit
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>
            <div className="space-y-2">
                <p className="text-sm text-gray-700">
                    <span className="font-medium">Account Number:</span> {account.accountNumber}
                </p>
                <p className="text-sm text-gray-700">
                    <span className="font-medium">Currency:</span> {account.currency}
                </p>
                <p className="text-sm text-gray-700">
                    <span className="font-medium">Balance:</span> {account.balance} {account.currency}
                </p>
                <p className="text-sm text-gray-700">
                    <span className="font-medium">Created By:</span> {account.createdByAdmin?.name || account.createdByAccounts?.name || 'Unknown'}
                </p>
            </div>
        </div>
    );
}
