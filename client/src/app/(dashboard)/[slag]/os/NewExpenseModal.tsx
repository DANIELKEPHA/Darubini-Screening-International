'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface NewExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectOperational: () => void;
}

export function NewExpenseModal({ isOpen, onClose, onSelectOperational }: NewExpenseModalProps) {
    const router = useRouter();

    const handleClientExpense = () => {
        router.push('/staff/client');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">Select Expense Type</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col sm:flex-row gap-4 p-6">
                    <Button
                        className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                        onClick={onSelectOperational}
                        aria-label="Create Operational Expense"
                    >
                        Operational Expense
                    </Button>
                    <Button
                        className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                        onClick={handleClientExpense}
                        aria-label="Create Client Expense"
                    >
                        Client Expense
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}