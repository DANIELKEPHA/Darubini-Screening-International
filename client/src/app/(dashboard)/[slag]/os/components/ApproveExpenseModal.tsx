'use client';

import { useMemo } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    useApproveOperationalExpenseMutation,
    useGetOperationalExpenseQuery,
    useGetBankAccountsQuery,
    useGetCashAccountsQuery,
} from '@/state/api';
import { BankAccount, CashAccount } from '@/state';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const approvalSchema = z
    .object({
        paymentAccountType: z.enum(['BANK', 'CASH']).optional(),
        bankAccountId: z.number().optional(),
        cashAccountId: z.number().optional(),
    })
    .refine(
        (data) => {
            if (data.paymentAccountType === 'BANK') return !!data.bankAccountId;
            if (data.paymentAccountType === 'CASH') return !!data.cashAccountId;
            return !data.paymentAccountType;
        },
        {
            message: 'Select an account for the chosen payment type',
            path: ['paymentAccountType'],
        }
    );

type ApprovalForm = z.infer<typeof approvalSchema>;

interface ApproveExpenseModalProps {
    expenseId: number;
    onClose: () => void;
    open: boolean;
}

export default function ApproveExpenseModal({
                                                expenseId,
                                                onClose,
                                                open,
                                            }: ApproveExpenseModalProps) {
    const { data: expense, isLoading: isExpenseLoading, error: expenseError } =
        useGetOperationalExpenseQuery(expenseId);

    const { data: bankAccountsData, isLoading: isBankAccountsLoading } = useGetBankAccountsQuery({ page: 1, limit: 100 });

    const { data: cashAccountsData, isLoading: isCashAccountsLoading } =
        useGetCashAccountsQuery({ page: 1, limit: 100 });
    const [approveOperationalExpense, { isLoading: isApproving }] =
        useApproveOperationalExpenseMutation();

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ApprovalForm>({
        resolver: zodResolver(approvalSchema),
        defaultValues: {
            paymentAccountType: undefined,
            bankAccountId: undefined,
            cashAccountId: undefined,
        },
    });

    const paymentAccountType = watch('paymentAccountType');
    const currency = expense?.currency;

    const filteredBankAccounts = useMemo(
        () =>
            bankAccountsData?.filter(
                (acc: BankAccount) => acc.currency === currency
            ) || [],
        [bankAccountsData, currency]
    );

    const filteredCashAccounts = useMemo(
        () =>
            cashAccountsData?.accounts?.filter(
                (acc: CashAccount) => acc.currency === currency
            ) || [],
        [cashAccountsData, currency]
    );

    const onSubmit: SubmitHandler<ApprovalForm> = async (data) => {
        console.log('Submitting approval with data:', data);
        try {
            await approveOperationalExpense({
                id: expenseId,
                data: {
                    bankAccountId: data.paymentAccountType === 'BANK' ? data.bankAccountId : undefined,
                    cashAccountId: data.paymentAccountType === 'CASH' ? data.cashAccountId : undefined,
                    mobileAccountId: undefined,
                    otherAccountId: undefined,
                },
            }).unwrap();
            toast.success('Expense approved successfully');
            onClose();
        } catch (err: any) {
            console.error('Approval error:', err);
            toast.error(`Failed to approve expense: ${err?.data?.message || 'Unknown error'}`);
        }
    };

    if (isExpenseLoading) {
        return (
            <div className="p-6 bg-primary-50 text-primary-800">
                Loading expense...
            </div>
        );
    }

    if (expenseError) {
        toast.error((expenseError as any)?.data?.message || 'Failed to load expense');
        return (
            <div className="p-6 bg-primary-50 text-primary-800">
                Failed to load expense details.
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Approve Expense: {expense?.expenseName} ({expense?.currency}{' '}
                        {expense?.totalAmount})
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <Label htmlFor="paymentAccountType">Payment Account Type</Label>
                        <Controller
                            name="paymentAccountType"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        setValue('bankAccountId', undefined);
                                        setValue('cashAccountId', undefined);
                                    }}
                                    value={field.value ?? ''}
                                    disabled={isApproving}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select account type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BANK">Bank Account</SelectItem>
                                        <SelectItem value="CASH">Cash Account</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.paymentAccountType && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.paymentAccountType.message}
                            </p>
                        )}
                    </div>

                    {paymentAccountType === 'BANK' && (
                        <div>
                            <Label htmlFor="bankAccountId">Bank Account</Label>
                            {isBankAccountsLoading ? (
                                <p className="mt-1 text-sm text-gray-500">
                                    Loading bank accounts...
                                </p>
                            ) : (
                                <>
                                    <Controller
                                        name="bankAccountId"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                onValueChange={(value) =>
                                                    field.onChange(parseInt(value))
                                                }
                                                value={
                                                    field.value !== undefined ? String(field.value) : ''
                                                }
                                                disabled={isApproving}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Select bank account" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredBankAccounts.map((account: BankAccount) => (
                                                        <SelectItem
                                                            key={account.id}
                                                            value={String(account.id)}
                                                        >
                                                            {account.accountName} ({account.accountNumber}) -{' '}
                                                            {account.currency} {account.balance}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.bankAccountId && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.bankAccountId.message}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {paymentAccountType === 'CASH' && (
                        <div>
                            <Label htmlFor="cashAccountId">Cash Account</Label>
                            {isCashAccountsLoading ? (
                                <p className="mt-1 text-sm text-gray-500">
                                    Loading cash accounts...
                                </p>
                            ) : (
                                <>
                                    <Controller
                                        name="cashAccountId"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                onValueChange={(value) =>
                                                    field.onChange(parseInt(value))
                                                }
                                                value={
                                                    field.value !== undefined ? String(field.value) : ''
                                                }
                                                disabled={isApproving}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Select cash account" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredCashAccounts.map((account: CashAccount) => (
                                                        <SelectItem
                                                            key={account.id}
                                                            value={String(account.id)}
                                                        >
                                                            {account.accountName} ({account.accountNumber}) -{' '}
                                                            {account.currency} {account.balance}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.cashAccountId && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.cashAccountId.message}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={onClose} disabled={isApproving}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isApproving || Object.keys(errors).length > 0}
                        >
                            {isApproving ? 'Approving...' : 'Approve'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
