'use client';

import React, { useState } from 'react';
import { useCloseCashAccountMutation, useDeleteCashAccountMutation } from '@/state/api';

import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

import { CreditCard, ArrowDownToLine, Edit, XCircle, Trash2, AlertTriangle } from 'lucide-react';

import { CashAccount } from '@/state';

interface AccountManagementPanelProps {
    account: CashAccount;
    onEdit: () => void;
    onDeposit: () => void;
    isDepositing: boolean;
    currentUserRole?: 'admin' | 'accounts' | 'staff';
}

export default function AccountManagementPanel({
                                                   account,
                                                   onEdit,
                                                   onDeposit,
                                                   isDepositing,
                                                   currentUserRole = 'staff',
                                               }: AccountManagementPanelProps) {
    const [closeAccount] = useCloseCashAccountMutation();
    const [deleteAccount] = useDeleteCashAccountMutation();

    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [closeReason, setCloseReason] = useState('');
    const [deleteReason, setDeleteReason] = useState('');
    const [isClosing, setIsClosing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isClosed = account.status === 'CLOSED' || !account.isActive;
    const canClose = !isClosed && (currentUserRole === 'admin' || currentUserRole === 'accounts');
    const canDelete = isClosed && currentUserRole === 'admin' && account.closedAt;

    const daysSinceClosure = account.closedAt
        ? Math.floor((Date.now() - new Date(account.closedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const handleCloseAccount = async () => {
        if (!closeReason.trim()) {
            toast.error("Please provide a reason for closing the account");
            return;
        }

        setIsClosing(true);
        try {
            await closeAccount({
                id: account.id,
                reason: closeReason.trim(),
                notes: "Closed via account management panel",
            }).unwrap();

            setShowCloseModal(false);
            setCloseReason('');
            toast.success("Cash account has been closed successfully");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to close account");
        } finally {
            setIsClosing(false);
        }
    };

    const handlePermanentDelete = async () => {
        if (!deleteReason.trim()) {
            toast.error("Please provide a reason for permanent deletion");
            return;
        }

        setIsDeleting(true);
        try {
            await deleteAccount({
                id: account.id,
                reason: deleteReason.trim(),
            }).unwrap();

            setShowDeleteModal(false);
            setDeleteReason('');
            toast.success("Account permanently deleted");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to permanently delete account");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Account Management</CardTitle>
                        <CardDescription>View details and manage account lifecycle</CardDescription>
                    </div>
                    <Badge variant={isClosed ? "destructive" : "default"} className="text-sm px-3 py-1">
                        {isClosed ? "CLOSED" : "ACTIVE"}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-8">
                {/* Account Information */}
                <div className="flex items-start gap-4">
                    <CreditCard className="h-6 w-6 text-gray-400 mt-1" />
                    <div className="flex-1 space-y-4">
                        <h4 className="font-semibold text-lg text-gray-900">Account Information</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-sm">
                            <div>
                                <p className="text-gray-500">Account Name</p>
                                <p className="font-medium mt-1">{account.accountName}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Currency</p>
                                <p className="font-medium mt-1">{account.currency}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Account ID</p>
                                <p className="font-mono text-gray-600 mt-1">#{account.id}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Current Balance</p>
                                <p className="font-semibold text-xl mt-1">
                                    {formatCurrency(Number(account.balance), account.currency)}
                                </p>
                            </div>

                            {account.description && (
                                <div className="md:col-span-2">
                                    <p className="text-gray-500">Description</p>
                                    <p className="text-gray-700 mt-1">{account.description}</p>
                                </div>
                            )}

                            {account.closedAt && (
                                <div className="md:col-span-2 pt-4 border-t">
                                    <p className="text-gray-500">Closed On</p>
                                    <p className="font-medium mt-1">{formatDate(account.closedAt)}</p>
                                    {account.closureReason && (
                                        <p className="text-sm text-gray-600 mt-2">
                                            Reason: <span className="font-medium">{account.closureReason}</span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-6 border-t">
                    <Button
                        onClick={onDeposit}
                        disabled={isDepositing || isClosed}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <ArrowDownToLine className="mr-2 h-4 w-4" />
                        Make Deposit
                    </Button>

                    <Button onClick={onEdit} variant="outline" disabled={isClosed}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Account
                    </Button>

                    {canClose && (
                        <Button
                            onClick={() => setShowCloseModal(true)}
                            variant="destructive"
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Close Account
                        </Button>
                    )}

                    {canDelete && (
                        <Button
                            onClick={() => setShowDeleteModal(true)}
                            variant="destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Permanently Delete
                        </Button>
                    )}
                </div>

                {/* Warning Message */}
                {isClosed && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-amber-700">
                            This account is closed. No further deposits or transactions are allowed.
                            {daysSinceClosure >= 90 && currentUserRole === 'admin' && (
                                <p className="mt-2 font-medium">You can now permanently delete this account.</p>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Close Account Modal */}
            <Dialog open={showCloseModal} onOpenChange={setShowCloseModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Close Cash Account</DialogTitle>
                        <DialogDescription>
                            Closing this account will prevent any future deposits or transactions.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Label htmlFor="close-reason" className="text-sm font-medium">
                            Reason for closing <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="close-reason"
                            placeholder="Enter detailed reason for closing this account..."
                            value={closeReason}
                            onChange={(e) => setCloseReason(e.target.value)}
                            className="mt-2"
                            rows={4}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCloseModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCloseAccount}
                            disabled={isClosing || !closeReason.trim()}
                        >
                            {isClosing ? "Closing Account..." : "Confirm Close"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Permanent Delete Modal */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Permanently Delete Account</DialogTitle>
                        <DialogDescription className="text-red-600/80">
                            This action is irreversible and can only be performed by an Administrator.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Label htmlFor="delete-reason" className="text-sm font-medium">
                            Reason for permanent deletion <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="delete-reason"
                            placeholder="Provide a clear reason for permanent deletion..."
                            value={deleteReason}
                            onChange={(e) => setDeleteReason(e.target.value)}
                            className="mt-2"
                            rows={4}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handlePermanentDelete}
                            disabled={isDeleting || !deleteReason.trim()}
                        >
                            {isDeleting ? "Deleting..." : "Permanently Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}