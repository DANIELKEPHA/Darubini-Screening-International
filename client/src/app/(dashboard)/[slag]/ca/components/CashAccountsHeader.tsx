// app/(dashboard)/[slag]/ca/components/CashAccountsHeader.tsx
'use client';

import { DollarSign, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface CashAccountsHeaderProps {
    onNewAccount: () => void;
}

export function CashAccountsHeader({
                                       onNewAccount,
                                   }: CashAccountsHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            {/* Left side - Title & description */}
            <div>
                <h1 className="text-4xl font-bold text-primary">Cash Accounts</h1>
                <p className="text-gray-600 mt-2">
                    Manage your cash accounts and track expenses in real-time
                </p>
            </div>

            {/* Right side - Actions */}
            <div className="flex flex-wrap gap-3">

                <Button
                    onClick={onNewAccount}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white rounded-xl shadow-lg transition-all"
                >
                    <Plus className="h-5 w-5" />
                    <span>New Account</span>
                </Button>
            </div>
        </div>
    );
}