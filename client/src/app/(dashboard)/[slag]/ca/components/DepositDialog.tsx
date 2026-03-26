'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { CashAccount } from '@/state';

interface DepositDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    account: CashAccount;
    onSubmit: (amount: number, description?: string) => Promise<void>;
    isLoading: boolean;
}

export function DepositDialog({
                                  open,
                                  onOpenChange,
                                  account,
                                  onSubmit,
                                  isLoading,
                              }: DepositDialogProps) {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        setError(null);
        const numAmount = Number(amount.trim());

        if (!amount || isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid positive amount');
            return;
        }

        try {
            await onSubmit(numAmount, description.trim() || undefined);
            // Reset form on success
            setAmount('');
            setDescription('');
            setError(null);
            onOpenChange(false);
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to add funds. Please try again.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-green-100 p-2">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-semibold">
                                Add Funds to {account.accountName}
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground mt-1">
                                Current balance:{' '}
                                {formatCurrency(Number(account.balance || 0), account.currency || 'Ksh')}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="amount" className="text-base font-medium">
                            Amount ({account.currency || 'Ksh'})
                        </Label>
                        <div className="relative">
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => {
                                    setAmount(e.target.value);
                                    setError(null);
                                }}
                                disabled={isLoading}
                                className="pl-10 text-lg font-medium"
                            />
                            <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description" className="text-base font-medium">
                            Description (optional)
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="e.g., Cash deposit from client, petty cash top-up, bank transfer..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isLoading}
                            className="min-h-[100px] resize-none"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-3 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !amount || Number(amount) <= 0}
                        className="w-full bg-green-600 hover:bg-green-700 sm:w-auto"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Funds
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}