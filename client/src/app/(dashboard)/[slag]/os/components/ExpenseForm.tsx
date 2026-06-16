'use client';

import { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    useCreateOperationalExpenseMutation,
    useUpdateOperationalExpenseMutation,
    useGetCurrenciesQuery,
    useGetBankAccountsQuery,
    useGetCashAccountsQuery,
    useGetAuthUserQuery,
} from '@/state/api';
import {
    OperationalExpense,
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
import { AlertCircle, Save, Send, X, CreditCard, Building2, Receipt } from 'lucide-react';
import { ExpenseFormData, expenseFormSchema, createExpenseSchema } from "@/lib/schemas";
import { HeaderFields } from './ExpenseHeaderFields';

interface ExpenseFormProps {
    expense?: OperationalExpense | null;
    onClose: () => void;
    headerFields: HeaderFields;
}

export default function ExpenseForm({ expense, onClose, headerFields }: ExpenseFormProps) {
    const isEditing = !!expense;
    const dispatch = useDispatch();
    const userRole = useSelector((state: any) => state.global.user?.role);
    const isStaff = userRole === 'staff';

    const { data: authUser } = useGetAuthUserQuery();
    const agentNameFromUser =
        authUser?.userInfo?.name ||
        authUser?.userInfo?.email?.split("@")[0] ||
        "User";

    const { bankAccounts, cashAccounts } = useSelector(
        (state: any) => state.global.operationalExpenses
    );

    const { data: currencies, isLoading: isCurrenciesLoading } = useGetCurrenciesQuery();
    const { data: bankAccountsData, isLoading: isBankAccountsLoading } =
        useGetBankAccountsQuery({ page: 1, limit: 100 });
    const { data: cashAccountsData, isLoading: isCashAccountsLoading } =
        useGetCashAccountsQuery({ page: 1, limit: 100 });

    const [createOperationalExpense, { isLoading: isCreating }] =
        useCreateOperationalExpenseMutation();
    const [updateOperationalExpense, { isLoading: isUpdating }] =
        useUpdateOperationalExpenseMutation();

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ExpenseFormData>({
        resolver: zodResolver(expenseFormSchema),
        defaultValues: {
            expenseName: expense?.expenseName || '',
            amount: expense?.amount != null
                ? Number(expense.amount)
                : 0,
            institutionName: expense?.institutionName || '',
            expenseDetails: expense?.expenseDetails || '',
            frequency: expense?.frequency || Frequency.ONCE_OFF,
            paymentMode: expense?.paymentMode || PaymentMode.CASH,
            paymentModeDescription: expense?.paymentModeDescription || '',
            itemType: expense?.itemType || ItemType.GOODS,
            accountType: expense?.accountType || AccountType.MISCELLANEOUS_EXPENSE,
            expenseStatus: expense?.expenseStatus || ExpenseStatus.DRAFT,
        },
    });

    const amount = watch('amount');
    const currency = headerFields.currency;
    const paymentAccountType = headerFields.paymentAccountType;
    const selectedBankAccountId = headerFields.bankAccountId;
    const selectedCashAccountId = headerFields.cashAccountId;

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
    }, [
        paymentAccountType,
        selectedBankAccountId,
        selectedCashAccountId,
        bankAccounts,
        cashAccounts,
    ]);

    // Helper function to safely format balance
    const formatBalance = (balance: any): string => {
        if (balance === undefined || balance === null) return '0.00';
        const numBalance = typeof balance === 'string' ? parseFloat(balance) : Number(balance);
        return isNaN(numBalance) ? '0.00' : numBalance.toFixed(2);
    };

    const balanceValue = selectedAccount?.balance !== undefined && selectedAccount?.balance !== null
        ? (typeof selectedAccount.balance === 'string' ? parseFloat(selectedAccount.balance) : Number(selectedAccount.balance))
        : 0;

    const isLowBalance = selectedAccount && balanceValue < 1000;
    const isInsufficientBalance = selectedAccount && balanceValue < amount;

    const onSubmit = async (data: any, isDraft: boolean) => {
        try {
            const dataToSubmit = {
                ...data,
                currency: headerFields.currency,
                date: headerFields.date,
                agentName: headerFields.agentName || agentNameFromUser,
                paymentAccountType: headerFields.paymentAccountType,
                bankAccountId:
                    headerFields.paymentAccountType === "BANK"
                        ? headerFields.bankAccountId
                        : undefined,
                cashAccountId:
                    headerFields.paymentAccountType === "CASH"
                        ? headerFields.cashAccountId
                        : undefined,
                expenseStatus: isDraft
                    ? ExpenseStatus.DRAFT
                    : ExpenseStatus.PENDING,
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
            toast.error(
                `Failed to ${isEditing ? 'update' : 'create'} expense: ${
                    err?.data?.message || 'Unknown error'
                }`
            );
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <Card className="border-0 shadow-2xl bg-white">
                <CardContent className="p-2">
                    <form onSubmit={handleSubmit((data) => onSubmit(data, false))}>
                        <div className="space-y-8">
                            {/* Primary Information Section */}
                            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <Label htmlFor="expenseName" className="text-sm font-medium text-gray-700">
                                            Expense Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Controller
                                            name="expenseName"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    className="mt-1.5 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="Enter expense name"
                                                    disabled={isCreating || isUpdating}
                                                />
                                            )}
                                        />
                                        {errors.expenseName && (
                                            <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                {errors.expenseName.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="institutionName" className="text-sm font-medium text-gray-700">
                                            Institution Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Controller
                                            name="institutionName"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    className="mt-1.5 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="Enter institution name"
                                                    disabled={isCreating || isUpdating}
                                                />
                                            )}
                                        />
                                        {errors.institutionName && (
                                            <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                {errors.institutionName.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expense Details Section */}
                            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <Label htmlFor="expenseDetails" className="text-sm font-medium text-gray-700">
                                            Expense Details <span className="text-red-500">*</span>
                                        </Label>
                                        <Controller
                                            name="expenseDetails"
                                            control={control}
                                            render={({ field }) => (
                                                <Textarea
                                                    {...field}
                                                    className="mt-1.5 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                                                    placeholder="Enter expense details"
                                                    disabled={isCreating || isUpdating}
                                                />
                                            )}
                                        />
                                        {errors.expenseDetails && (
                                            <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                {errors.expenseDetails.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Classification Section */}
                            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                            Item Type <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="space-y-2 mt-1.5">
                                            {Object.values(ItemType).map((type) => (
                                                <Controller
                                                    key={type}
                                                    name="itemType"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <label className="flex items-center space-x-3 p-2 rounded hover:bg-gray-100 cursor-pointer">
                                                            <Input
                                                                type="radio"
                                                                value={type}
                                                                checked={field.value === type}
                                                                onChange={field.onChange}
                                                                disabled={isCreating || isUpdating}
                                                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm text-gray-700">
                                                                {formatEnumString(type)}
                                                            </span>
                                                        </label>
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        {errors.itemType && (
                                            <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                {errors.itemType.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="accountType" className="text-sm font-medium text-gray-700">
                                            Expense Category <span className="text-red-500">*</span>
                                        </Label>
                                        <Controller
                                            name="accountType"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    disabled={isCreating || isUpdating}
                                                >
                                                    <SelectTrigger className="mt-1.5 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.values(AccountType).map((type) => (
                                                            <SelectItem key={type} value={type}>
                                                                {formatEnumString(type)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.accountType && (
                                            <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                {errors.accountType.message}
                                            </p>
                                        )}
                                        {isStaff && (
                                            <p className="mt-2 text-xs text-gray-500">
                                                Account will be assigned during approval.
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="frequency" className="text-sm font-medium text-gray-700">
                                            Frequency <span className="text-red-500">*</span>
                                        </Label>
                                        <Controller
                                            name="frequency"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    disabled={isCreating || isUpdating}
                                                >
                                                    <SelectTrigger className="mt-1.5 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                                        <SelectValue placeholder="Select frequency" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.values(Frequency).map((freq) => (
                                                            <SelectItem key={freq} value={freq}>
                                                                {formatEnumString(freq)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.frequency && (
                                            <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                {errors.frequency.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Payment Information Section */}
                            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <Label htmlFor="paymentMode" className="text-sm font-medium text-gray-700">
                                            Payment Mode <span className="text-red-500">*</span>
                                        </Label>
                                        <Controller
                                            name="paymentMode"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    disabled={isCreating || isUpdating}
                                                >
                                                    <SelectTrigger className="mt-1.5 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                                        <SelectValue placeholder="Select payment mode" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.values(PaymentMode).map((mode) => (
                                                            <SelectItem key={mode} value={mode}>
                                                                {formatEnumString(mode)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.paymentMode && (
                                            <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                {errors.paymentMode.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                                            Amount <span className="text-red-500">*</span>
                                        </Label>
                                        <Controller
                                            name="amount"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="relative mt-1.5">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                                                        {currency || '$'}
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                        className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                                        placeholder="0.00"
                                                        min={0}
                                                        step="0.01"
                                                        disabled={isCreating || isUpdating}
                                                    />
                                                </div>
                                            )}
                                        />
                                        {errors.amount && (
                                            <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                {errors.amount.message}
                                            </p>
                                        )}
                                        {selectedAccount && (
                                            <div className={`mt-2 p-2 rounded ${isLowBalance ? 'bg-red-50' : 'bg-gray-100'}`}>
                                                <p className={`text-sm ${isLowBalance ? 'text-red-600' : 'text-gray-600'}`}>
                                                    Available Balance: {selectedAccount.currency} {formatBalance(selectedAccount.balance)}
                                                    {isLowBalance && ' ⚠️ Low balance'}
                                                    {isInsufficientBalance && (
                                                        <span className="flex items-center mt-1 text-red-600">
                                                            <AlertCircle className="h-4 w-4 mr-1" />
                                                            Insufficient balance for {currency} {amount}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={isCreating || isUpdating}
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleSubmit((data) => onSubmit(data, true))}
                                    disabled={isCreating || isUpdating}
                                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Draft
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={isCreating || isUpdating}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Send className="h-4 w-4 mr-2" />
                                    {isEditing ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}