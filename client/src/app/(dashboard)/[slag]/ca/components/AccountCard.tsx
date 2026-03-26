'use client';

import { CashAccount } from '@/state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface AccountCardProps {
    account: CashAccount | null;
    isSelected: boolean;
    onSelect: (account: CashAccount) => void;
    onDelete: (id: number) => void;
}

export default function AccountCard({ account, isSelected, onSelect, onDelete }: AccountCardProps) {
    if (!account) {
        return (
            <Card className="border-2 border-gray-200">
                <CardContent className="p-4 text-gray-500">
                    Invalid account data
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 animate-in fade-in duration-300 ${
                isSelected
                    ? 'border-primary bg-primary-50/50'
                    : 'border-gray-200 hover:border-primary'
            }`}
            onClick={() => onSelect(account)}
        >
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-semibold text-primary truncate">
                            {account.accountName || 'Unnamed Account'}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                            {account.currency}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(account.id); }}>
                            <Trash2 className="h-4 w-4 text-primary" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}