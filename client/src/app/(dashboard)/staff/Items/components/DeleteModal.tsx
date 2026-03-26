'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface DeleteModalProps {
    itemId: number;
    onClose: () => void;
    onDelete: () => Promise<any>;
}

export default function DeleteModal({ itemId, onClose, onDelete }: DeleteModalProps) {
    const handleDelete = async () => {
        try {
            await onDelete();
            toast.success('Expense deleted successfully');
            onClose();
        } catch (err) {
            toast.error('Failed to delete expense');
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                </DialogHeader>
                <p className="text-gray-600">Are you sure you want to delete this expense?</p>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}