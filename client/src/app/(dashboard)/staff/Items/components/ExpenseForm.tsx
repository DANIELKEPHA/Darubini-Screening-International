'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    useCreateOperationalExpenseMutation,
    useUpdateOperationalExpenseMutation,
    useGetCurrenciesQuery,
    useGetBankAccountsQuery,
    useGetCashAccountsQuery,
} from '@/state/api';
import {
    OperationalExpense,
    Currency,
    ItemType,
    AccountType,
    Frequency,
    PaymentMode,
    ExpenseStatus,
    BankAccount,
    CashAccount,
} from '@/state';
import { setBankAccounts, setCashAccounts } from '@/state';
import { formatEnumString } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';

const expenseSchema = z.object({
    expenseName: z.string().min(1, 'Expense name is required'),
    amount: z.number().min(0, 'Amount must be positive'),
    currency: z.string().min(1, 'Currency is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    agentName: z.string().min(1, 'Agent name is required'),
    kraPin: z.string().regex(/^[A-Za-z0-9]{11}$/, 'KRA PIN must be 11 characters').optional(),
    institutionName: z.string().min(1, 'Institution name is required'),
    expenseDetails: z.string().min(1, 'Details are required').max(1000, 'Details must be 1000 characters or less'),
    reasonForPayment: z.string().optional(),
    frequency: z.enum(Object.values(Frequency) as [string, ...string[]]),
    paymentMode: z.enum(Object.values(PaymentMode) as [string, ...string[]]),
    paymentModeDescription: z.string().optional(),
    itemType: z.enum(Object.values(ItemType) as [string, ...string[]]),
    accountType: z.enum(Object.values(AccountType) as [string, ...string[]]),
    paymentAccountType: z.enum(['BANK', 'CASH', 'MOBILE', 'OTHER']).optional(),
    bankAccountId: z.number().optional(),
    cashAccountId: z.number().optional(),
    expenseStatus: z.enum(Object.values(ExpenseStatus) as [string, ...string[]]),
}).refine(
    (data) => {
        if (data.paymentAccountType === 'BANK') return !!data.bankAccountId;
        if (data.paymentAccountType === 'CASH') return !!data.cashAccountId;
        return true;
    },
    { message: 'Select an account for the chosen payment type', path: ['paymentAccountType'] }
);

interface ExpenseFormProps {
    expense?: OperationalExpense | null;
    onClose: () => void;
}

export default function ExpenseForm({ expense, onClose }: ExpenseFormProps) {
    const isEditing = !!expense;
    const dispatch = useDispatch();
    const userRole = useSelector((state: any) => state.global.user?.role);
    const isStaff = userRole === 'staff';
    const { bankAccounts, cashAccounts } = useSelector((state: any) => state.global.operationalExpenses);

    const { data: currencies, isLoading: isCurrenciesLoading } = useGetCurrenciesQuery();
    const { data: bankAccountsData, isLoading: isBankAccountsLoading } = useGetBankAccountsQuery({ page: 1, limit: 100 });
    const { data: cashAccountsData, isLoading: isCashAccountsLoading } = useGetCashAccountsQuery({ page: 1, limit: 100 });
    const [createOperationalExpense, { isLoading: isCreating }] = useCreateOperationalExpenseMutation();
    const [updateOperationalExpense, { isLoading: isUpdating }] = useUpdateOperationalExpenseMutation();

    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            expenseName: expense?.expenseName || '',
            amount: expense?.amount || 0,
            currency: expense?.currency || 'KES',
            date: expense?.date || new Date().toISOString().split('T')[0],
            agentName: expense?.agentName || '',
            kraPin: expense?.kraPin || undefined,
            institutionName: expense?.institutionName || '',
            expenseDetails: expense?.expenseDetails || '',
            reasonForPayment: expense?.reasonForPayment || '',
            frequency: expense?.frequency || Frequency.ONCE_OFF,
            paymentMode: expense?.paymentMode || PaymentMode.CASH,
            paymentModeDescription: expense?.paymentModeDescription || '',
            itemType: expense?.itemType || ItemType.GOODS,
            accountType: expense?.accountType || AccountType.MISCELLANEOUS_EXPENSE,
            paymentAccountType: expense?.bankAccountId ? 'BANK' : expense?.cashAccountId ? 'CASH' : undefined,
            bankAccountId: expense?.bankAccountId || undefined,
            cashAccountId: expense?.cashAccountId || undefined,
            expenseStatus: expense?.expenseStatus || ExpenseStatus.DRAFT,
        },
    });

    const paymentAccountType = watch('paymentAccountType');
    const currency = watch('currency');
    const amount = watch('amount');
    const selectedBankAccountId = watch('bankAccountId');
    const selectedCashAccountId = watch('cashAccountId');

    useEffect(() => {
        if (bankAccountsData) dispatch(setBankAccounts(bankAccountsData));
        if (cashAccountsData?.accounts) dispatch(setCashAccounts(cashAccountsData.accounts));
    }, [bankAccountsData, cashAccountsData, dispatch]);


    const filteredBankAccounts = useMemo(
        () => bankAccounts?.filter((acc: BankAccount) => acc.currency === currency) || [],
        [bankAccounts, currency]
    );
    const filteredCashAccounts = useMemo(
        () => cashAccounts?.filter((acc: CashAccount) => acc.currency === currency) || [],
        [cashAccounts, currency]
    );

    const selectedAccount = useMemo(() => {
        if (paymentAccountType === 'BANK' && selectedBankAccountId) {
            return bankAccounts?.find((acc: BankAccount) => acc.id === selectedBankAccountId);
        }
        if (paymentAccountType === 'CASH' && selectedCashAccountId) {
            return cashAccounts?.find((acc: CashAccount) => acc.id === selectedCashAccountId);
        }
        return null;
    }, [paymentAccountType, selectedBankAccountId, selectedCashAccountId, bankAccounts, cashAccounts]);

    const isLowBalance = selectedAccount && selectedAccount.balance < 1000;
    const isInsufficientBalance = selectedAccount && selectedAccount.balance < amount;

    const onSubmit = async (data: any, isDraft: boolean) => {
        try {
            const dataToSubmit = {
                ...data,
                expenseStatus: isDraft ? ExpenseStatus.DRAFT : ExpenseStatus.PENDING,
                bankAccountId: data.paymentAccountType === 'BANK' ? data.bankAccountId : undefined,
                cashAccountId: data.paymentAccountType === 'CASH' ? data.cashAccountId : undefined,
            };
            if (isEditing && expense?.id) {
                await updateOperationalExpense({ id: expense.id, data: dataToSubmit }).unwrap();
                toast.success('Expense updated successfully');
            } else {
                await createOperationalExpense(dataToSubmit).unwrap();
                toast.success('Expense created successfully');
            }
            onClose();
        } catch (err: any) {
            toast.error(`Failed to ${isEditing ? 'update' : 'create'} expense: ${err?.data?.message || 'Unknown error'}`);
        }
    };

    return (
        <Card className="max-w-3xl mx-auto bg-primary-50">
            <CardHeader>
                <CardTitle className="text-primary-800">{isEditing ? 'Edit Expense' : 'Create Expense'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit((data) => onSubmit(data, false))}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="expenseName">Expense Name</Label>
                            <Controller
                                name="expenseName"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} className="mt-1" placeholder="Enter expense name" disabled={isCreating || isUpdating} />
                                )}
                            />
                            {errors.expenseName && <p className="mt-1 text-sm text-red-600">{errors.expenseName.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="amount">Amount</Label>
                            <Controller
                                name="amount"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                        className="mt-1"
                                        placeholder="0.00"
                                        min={0}
                                        step="0.01"
                                        disabled={isCreating || isUpdating}
                                    />
                                )}
                            />
                            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="currency">Currency</Label>
                            {isCurrenciesLoading ? (
                                <p className="mt-1 text-sm text-gray-500">Loading currencies...</p>
                            ) : (
                                <Controller
                                    name="currency"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value} disabled={isCreating || isUpdating}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Select currency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {currencies?.map((curr: Currency) => (
                                                    <SelectItem key={curr.code} value={curr.code}>{curr.name} ({curr.code})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            )}
                            {errors.currency && <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="date">Date</Label>
                            <Controller
                                name="date"
                                control={control}
                                render={({ field }) => (
                                    <Input type="date" {...field} className="mt-1" disabled={isCreating || isUpdating} />
                                )}
                            />
                            {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
                        </div>
                    </div>

                    <Card className="p-4">
                        <CardTitle className="text-lg text-primary-800">Item Type</CardTitle>
                        <div className="flex space-x-4 mt-4">
                            {Object.values(ItemType).map((type) => (
                                <Controller
                                    key={type}
                                    name="itemType"
                                    control={control}
                                    render={({ field }) => (
                                        <label className="flex items-center space-x-2">
                                            <Input
                                                type="radio"
                                                value={type}
                                                checked={field.value === type}
                                                onChange={field.onChange}
                                                disabled={isCreating || isUpdating}
                                            />
                                            <span>{formatEnumString(type)}</span>
                                        </label>
                                    )}
                                />
                            ))}
                        </div>
                        {errors.itemType && <p className="mt-1 text-sm text-red-600">{errors.itemType.message}</p>}
                    </Card>

                    <Card className="p-4">
                        <CardTitle className="text-lg text-primary-800">Account Information</CardTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <Label htmlFor="accountType">Expense Category</Label>
                                <Controller
                                    name="accountType"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value} disabled={isCreating || isUpdating}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.values(AccountType).map((type) => (
                                                    <SelectItem key={type} value={type}>{formatEnumString(type)}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.accountType && <p className="mt-1 text-sm text-red-600">{errors.accountType.message}</p>}
                            </div>
                            {!isStaff && (
                                <>
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
                                                    value={field.value}
                                                    disabled={isCreating || isUpdating}
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
                                        {errors.paymentAccountType && <p className="mt-1 text-sm text-red-600">{errors.paymentAccountType.message}</p>}
                                    </div>
                                    {paymentAccountType === 'BANK' && (
                                        <div>
                                            <Label htmlFor="bankAccountId">Bank Account</Label>
                                            {isBankAccountsLoading ? (
                                                <p className="mt-1 text-sm text-gray-500">Loading bank accounts...</p>
                                            ) : (
                                                <>
                                                    <Controller
                                                        name="bankAccountId"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Select
                                                                onValueChange={(value) => field.onChange(parseInt(value))}
                                                                value={field.value?.toString()}
                                                                disabled={isCreating || isUpdating}
                                                            >
                                                                <SelectTrigger className="mt-1">
                                                                    <SelectValue placeholder="Select bank account" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {filteredBankAccounts.map((account: BankAccount) => (
                                                                        <SelectItem key={account.id} value={account.id.toString()}>
                                                                            {account.accountName} ({account.accountNumber}) - {account.currency} {account.balance}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    />
                                                    {errors.bankAccountId && <p className="mt-1 text-sm text-red-600">{errors.bankAccountId.message}</p>}
                                                    {selectedAccount && (
                                                        <p className={`mt-1 text-sm ${isLowBalance ? 'text-red-600' : 'text-gray-500'}`}>
                                                            Balance: {selectedAccount.currency} {selectedAccount.balance}
                                                            {isLowBalance && ' (Low balance)'}
                                                            {isInsufficientBalance && (
                                                                <span className="flex items-center text-red-600">
                                                                    <AlertCircle className="h-4 w-4 mr-1" />
                                                                    Insufficient balance for {currency} {amount}
                                                                </span>
                                                            )}
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
                                                <p className="mt-1 text-sm text-gray-500">Loading cash accounts...</p>
                                            ) : (
                                                <>
                                                    <Controller
                                                        name="cashAccountId"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Select
                                                                onValueChange={(value) => field.onChange(parseInt(value))}
                                                                value={field.value?.toString()}
                                                                disabled={isCreating || isUpdating}
                                                            >
                                                                <SelectTrigger className="mt-1">
                                                                    <SelectValue placeholder="Select cash account" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {filteredCashAccounts.map((account: CashAccount) => (
                                                                        <SelectItem key={account.id} value={account.id.toString()}>
                                                                            {account.accountName} ({account.accountNumber}) - {account.currency} {account.balance}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    />
                                                    {errors.cashAccountId && <p className="mt-1 text-sm text-red-600">{errors.cashAccountId.message}</p>}
                                                    {selectedAccount && (
                                                        <p className={`mt-1 text-sm ${isLowBalance ? 'text-red-600' : 'text-gray-500'}`}>
                                                            Balance: {selectedAccount.currency} {selectedAccount.balance}
                                                            {isLowBalance && ' (Low balance)'}
                                                            {isInsufficientBalance && (
                                                                <span className="flex items-center text-red-600">
                                                                    <AlertCircle className="h-4 w-4 mr-1" />
                                                                    Insufficient balance for {currency} {amount}
                                                                </span>
                                                            )}
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                            {isStaff && (
                                <p className="text-sm text-gray-500">Account will be assigned during approval.</p>
                            )}
                        </div>
                    </Card>

                    <Card className="p-4">
                        <CardTitle className="text-lg text-primary-800">Purchase Information</CardTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <Label htmlFor="agentName">Agent Name</Label>
                                <Controller
                                    name="agentName"
                                    control={control}
                                    render={({ field }) => (
                                        <Input {...field} className="mt-1" placeholder="Enter agent name" disabled={isCreating || isUpdating} />
                                    )}
                                />
                                {errors.agentName && <p className="mt-1 text-sm text-red-600">{errors.agentName.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="kraPin">KRA PIN (Optional)</Label>
                                <Controller
                                    name="kraPin"
                                    control={control}
                                    render={({ field }) => (
                                        <Input {...field} className="mt-1" placeholder="A1234567890" maxLength={11} disabled={isCreating || isUpdating} />
                                    )}
                                />
                                {errors.kraPin && <p className="mt-1 text-sm text-red-600">{errors.kraPin.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="institutionName">Institution Name</Label>
                                <Controller
                                    name="institutionName"
                                    control={control}
                                    render={({ field }) => (
                                        <Input {...field} className="mt-1" placeholder="Enter institution name" disabled={isCreating || isUpdating} />
                                    )}
                                />
                                {errors.institutionName && <p className="mt-1 text-sm text-red-600">{errors.institutionName.message}</p>}
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <CardTitle className="text-lg text-primary-800">Additional Information</CardTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <Label htmlFor="expenseDetails">Expense Details</Label>
                                <Controller
                                    name="expenseDetails"
                                    control={control}
                                    render={({ field }) => (
                                        <Textarea {...field} className="mt-1" placeholder="Enter expense details" rows={4} disabled={isCreating || isUpdating} />
                                    )}
                                />
                                {errors.expenseDetails && <p className="mt-1 text-sm text-red-600">{errors.expenseDetails.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="reasonForPayment">Reason for Payment (Optional)</Label>
                                <Controller
                                    name="reasonForPayment"
                                    control={control}
                                    render={({ field }) => (
                                        <Input {...field} className="mt-1" placeholder="Enter reason" disabled={isCreating || isUpdating} />
                                    )}
                                />
                            </div>
                            <div>
                                <Label htmlFor="frequency">Frequency</Label>
                                <Controller
                                    name="frequency"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value} disabled={isCreating || isUpdating}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Select frequency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.values(Frequency).map((freq) => (
                                                    <SelectItem key={freq} value={freq}>{formatEnumString(freq)}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.frequency && <p className="mt-1 text-sm text-red-600">{errors.frequency.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="paymentMode">Payment Mode</Label>
                                <Controller
                                    name="paymentMode"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value} disabled={isCreating || isUpdating}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Select payment mode" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.values(PaymentMode).map((mode) => (
                                                    <SelectItem key={mode} value={mode}>{formatEnumString(mode)}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.paymentMode && <p className="mt-1 text-sm text-red-600">{errors.paymentMode.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="paymentModeDescription">Payment Mode Description (Optional)</Label>
                                <Controller
                                    name="paymentModeDescription"
                                    control={control}
                                    render={({ field }) => (
                                        <Input {...field} className="mt-1" placeholder="Optional description" disabled={isCreating || isUpdating} />
                                    )}
                                />
                            </div>
                        </div>
                    </Card>

                    <div className="flex justify-end space-x-4">
                        <Button variant="outline" onClick={onClose} disabled={isCreating || isUpdating}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            onClick={() => setValue('expenseStatus', ExpenseStatus.DRAFT)}
                            disabled={isCreating || isUpdating || Object.keys(errors).length > 0}
                        >
                            {isCreating && watch('expenseStatus') === ExpenseStatus.DRAFT ? 'Saving...' : 'Save as Draft'}
                        </Button>
                        {!isStaff && (
                            <Button
                                type="submit"
                                onClick={() => setValue('expenseStatus', ExpenseStatus.PENDING)}
                                disabled={isCreating || isUpdating || Object.keys(errors).length > 0}
                            >
                                {isCreating && watch('expenseStatus') === ExpenseStatus.PENDING ? 'Submitting...' : isEditing ? 'Update' : 'Create'}
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}