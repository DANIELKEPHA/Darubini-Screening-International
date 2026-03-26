'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
    useDeleteOperationalExpenseMutation,
    useDownloadOperationalExpensePdfMutation,
    useGetOperationalExpenseQuery,
    useGetTransactionsQuery,
    useReverseOperationalExpenseMutation,
    useReverseAndEditOperationalExpenseMutation,
    useGetAuditLogsQuery,
} from '@/state/api';
import { ExpenseStatus, OperationalExpense, Transaction, AuditLog } from '@/state';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import TransactionsTab from './[tabs]/TransactionsTab';
import OverviewTab from './[tabs]/OverviewTab';
import HistoryTab from './[tabs]/HistoryTab';
import { Trash2, FileText, Download, Pencil, MoreHorizontal, CreditCard } from 'lucide-react';
import {skipToken} from "@reduxjs/toolkit/query";

interface ExpenseDetailsProps {
    expense: OperationalExpense | null;
    onEdit: () => void;
    onClose: () => void;
}

const QUERY_LIMIT = 10;

export default function ExpenseDetails({ expense, onEdit, onClose }: ExpenseDetailsProps) {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);
    const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'auditlog'>('overview');

    const { data: expenseData, isLoading: isExpenseLoading } = useGetOperationalExpenseQuery(
        expense?.id ? expense.id : skipToken
    );
    const { data: transactionsData, isLoading: isTransactionsLoading } = useGetTransactionsQuery(
        { page: 1, limit: QUERY_LIMIT, expenseId: expense?.id },
        { skip: !expense?.id }
    );
    const { data: auditLogsResponse, isLoading: isAuditLogsLoading, error: auditLogsError } = useGetAuditLogsQuery(
        expense?.id ? { page: 1, limit: QUERY_LIMIT, entity: 'OperationalExpense', entityId: expense.id.toString() } : skipToken
    );
    const [deleteOperationalExpense, { isLoading: isDeleting }] = useDeleteOperationalExpenseMutation();
    const [downloadOperationalExpensePdf, { isLoading: isDownloading }] = useDownloadOperationalExpensePdfMutation();
    const [reverseOperationalExpense, { isLoading: isReversing }] = useReverseOperationalExpenseMutation();
    const [reverseAndEditOperationalExpense, { isLoading: isReversingAndEditing }] = useReverseAndEditOperationalExpenseMutation();

    const auditLogs: AuditLog[] = auditLogsResponse?.data || [];

    const handleDownload = async () => {
        if (!expense?.id) return;
        try {
            const pdfData = await downloadOperationalExpensePdf(expense.id).unwrap();
            const link = document.createElement('a');
            link.href = pdfData.url;
            link.download = pdfData.fileName || `expense-${expense.id}.pdf`;
            link.click();
            window.URL.revokeObjectURL(pdfData.url);
            toast.success('PDF downloaded successfully');
        } catch (err: any) {
            toast.error(`Failed to download PDF: ${err?.data?.message || 'Unknown error'}`);
        }
    };

    const handleDelete = async () => {
        if (!expense?.id) return;
        try {
            await deleteOperationalExpense(expense.id).unwrap();
            toast.success('Expense deleted successfully');
            onClose();
        } catch (err: any) {
            toast.error(`Failed to delete expense: ${err?.data?.message || 'Unknown error'}`);
        }
    };

    const handleReverse = async () => {
        if (!expense?.id) return;
        try {
            await reverseOperationalExpense(expense.id).unwrap();
            toast.success('Expense reversed successfully');
            setIsCreditNoteModalOpen(false);
            onClose();
        } catch (err: any) {
            toast.error(`Failed to reverse expense: ${err?.data?.message || 'Unknown error'}`);
        }
    };

    const handleReverseAndEdit = async () => {
        if (!expense?.id) return;
        try {
            await reverseAndEditOperationalExpense({ id: expense.id }).unwrap();
            toast.success('Expense reversed and new draft created successfully');
            setIsCreditNoteModalOpen(false);
            onEdit();
            onClose();
        } catch (err: any) {
            toast.error(`Failed to reverse and edit expense: ${err?.data?.message || 'Unknown error'}`);
        }
    };

    const handleEdit = () => {
        setIsActionsModalOpen(false);
        onEdit();
    };

    if (!expense) {
        return <Card className="p-6 bg-primary-50 text-primary-800">No expense selected. Please select an expense to view details.</Card>;
    }

    const currentExpense = expenseData || expense;
    const transactions = transactionsData?.transactions || [];
    const isCancelled = currentExpense.expenseStatus === ExpenseStatus.CANCELLED;
    const canReverse = !isCancelled && currentExpense.expenseStatus !== ExpenseStatus.DRAFT;
    const canEdit = !isCancelled && currentExpense.expenseStatus !== ExpenseStatus.APPROVED && currentExpense.expenseStatus !== ExpenseStatus.DRAFT;
    const canDownload = !isCancelled && currentExpense.expenseStatus !== ExpenseStatus.DRAFT;

    return (
        <Card className="p-6 bg-primary-50">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-primary-800">{currentExpense.expenseName}</CardTitle>
                    <div className="space-x-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsActionsModalOpen(true)}
                            disabled={isDeleting || isDownloading || isCancelled}
                        >
                            <MoreHorizontal className="w-4 h-4 mr-2" />
                            Actions
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsCreditNoteModalOpen(true)}
                            disabled={isDeleting || isDownloading || isReversing || isReversingAndEditing || isCancelled || !canReverse}
                        >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Credit Note
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isExpenseLoading && <p className="text-center text-primary-600">Loading expense details...</p>}
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview">
                        <OverviewTab expense={currentExpense} />
                    </TabsContent>
                    <TabsContent value="transactions">
                        <TransactionsTab transactions={transactions} isLoading={isTransactionsLoading} error={null} />
                    </TabsContent>
                    <TabsContent value="auditlog">
                        <HistoryTab auditLogs={auditLogs} isLoading={isAuditLogsLoading} error={auditLogsError} showEntityId={false} />
                    </TabsContent>
                </Tabs>
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Deletion</DialogTitle>
                        </DialogHeader>
                        <p>Are you sure you want to delete this expense?</p>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isCancelled}>Cancel</Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isDeleting || isCancelled}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Dialog open={isActionsModalOpen} onOpenChange={setIsActionsModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Action Options</DialogTitle>
                        </DialogHeader>
                        <p>Select an action for this expense:</p>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsActionsModalOpen(false)} disabled={isCancelled}>Cancel</Button>
                            <Button
                                onClick={handleEdit}
                                disabled={isDeleting || isDownloading || isCancelled || !canEdit}
                            >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => setIsDeleteModalOpen(true)}
                                disabled={isDeleting || isDownloading || isCancelled || currentExpense.expenseStatus === ExpenseStatus.APPROVED}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={handleDownload}
                                disabled={isDeleting || isDownloading || isCancelled || !canDownload}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                {isDownloading ? 'Downloading...' : 'Download PDF'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Dialog open={isCreditNoteModalOpen} onOpenChange={setIsCreditNoteModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Credit Note Options</DialogTitle>
                        </DialogHeader>
                        <p>Select an action for the credit note:</p>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreditNoteModalOpen(false)} disabled={isCancelled}>Cancel</Button>
                            <Button
                                variant="destructive"
                                onClick={handleReverse}
                                disabled={isReversing || isReversingAndEditing || isCancelled || !canReverse}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {isReversing ? 'Reversing...' : 'Reverse'}
                            </Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={handleReverseAndEdit}
                                disabled={isReversing || isReversingAndEditing || isCancelled || !canReverse}
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                {isReversingAndEditing ? 'Processing...' : 'Reverse and Edit'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}