'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    useGetCurrenciesQuery,
    useGetBankAccountsQuery,
    useGetCashAccountsQuery,
    useGetAuthUserQuery,
} from '@/state/api';
import { setBankAccounts, setCashAccounts } from '@/state';
import { BankAccount, CashAccount } from '@/state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { User, Calendar, CreditCard, Globe } from 'lucide-react';

interface ExpenseHeaderFieldsProps {
    onFieldsChange?: (fields: HeaderFields) => void;
    initialValues?: Partial<HeaderFields>;
}

export interface HeaderFields {
    currency: string;
    date: string;
    agentName: string;
    paymentAccountType: 'BANK' | 'CASH' | undefined;
    bankAccountId: number | undefined;
    cashAccountId: number | undefined;
}

export default function ExpenseHeaderFields({
                                                onFieldsChange,
                                                initialValues
                                            }: ExpenseHeaderFieldsProps) {
    const dispatch = useDispatch();

    // Get auth user for agent name
    const { data: authUser } = useGetAuthUserQuery();
    const agentNameFromUser =
        authUser?.userInfo?.name ||
        authUser?.userInfo?.email?.split("@")[0] ||
        "User";

    // Get currencies
    const { data: currencies, isLoading: isCurrenciesLoading } = useGetCurrenciesQuery();

    // Get bank and cash accounts
    const { data: bankAccountsData, isLoading: isBankAccountsLoading } =
        useGetBankAccountsQuery({ page: 1, limit: 100 });
    const { data: cashAccountsData, isLoading: isCashAccountsLoading } =
        useGetCashAccountsQuery({ page: 1, limit: 100 });

    // Get from Redux store
    const { bankAccounts, cashAccounts } = useSelector(
        (state: any) => state.global.operationalExpenses || { bankAccounts: [], cashAccounts: [] }
    );

    // Local state for header fields
    const [currency, setCurrency] = useState<string>(initialValues?.currency || 'KES');
    const [date, setDate] = useState<string>(initialValues?.date || new Date().toISOString().split('T')[0]);
    const [paymentAccountType, setPaymentAccountType] = useState<'BANK' | 'CASH' | undefined>(
        initialValues?.paymentAccountType || 'CASH'
    );
    const [bankAccountId, setBankAccountId] = useState<number | undefined>(initialValues?.bankAccountId);
    const [cashAccountId, setCashAccountId] = useState<number | undefined>(initialValues?.cashAccountId);

    // Update Redux store with account data
    useEffect(() => {
        if (bankAccountsData) dispatch(setBankAccounts(bankAccountsData));
        if (cashAccountsData?.accounts) dispatch(setCashAccounts(cashAccountsData.accounts));
    }, [bankAccountsData, cashAccountsData, dispatch]);

    // Filter accounts by currency
    const filteredBankAccounts = useMemo(
        () => bankAccounts?.filter((acc: BankAccount) => acc.currency === currency) || [],
        [bankAccounts, currency]
    );

    const filteredCashAccounts = useMemo(
        () => cashAccounts?.filter((acc: CashAccount) => acc.currency === currency) || [],
        [cashAccounts, currency]
    );

    useEffect(() => {
        if (paymentAccountType === 'CASH' && !cashAccountId && filteredCashAccounts.length > 0) {
            console.log('Auto-selecting cash account:', filteredCashAccounts[0]);
            setCashAccountId(filteredCashAccounts[0].id);
        }
    }, [paymentAccountType, filteredCashAccounts, cashAccountId]);

    useEffect(() => {
        if (paymentAccountType === 'CASH' && !cashAccountId && filteredCashAccounts.length > 0) {
            console.log('Auto-selecting cash account on load:', filteredCashAccounts[0]);
            setCashAccountId(filteredCashAccounts[0].id);
        }
    }, [filteredCashAccounts, paymentAccountType, cashAccountId]);

    const selectedAccount = useMemo(() => {
        if (paymentAccountType === 'BANK' && bankAccountId) {
            return bankAccounts?.find((acc: BankAccount) => acc.id === bankAccountId);
        }
        if (paymentAccountType === 'CASH' && cashAccountId) {
            return cashAccounts?.find((acc: CashAccount) => acc.id === cashAccountId);
        }
        return null;
    }, [paymentAccountType, bankAccountId, cashAccountId, bankAccounts, cashAccounts]);

    useEffect(() => {
        if (onFieldsChange) {
            onFieldsChange({
                currency,
                date,
                agentName: agentNameFromUser,
                paymentAccountType,
                bankAccountId,
                cashAccountId,
            });
        }
    }, [currency, date, agentNameFromUser, paymentAccountType, bankAccountId, cashAccountId, onFieldsChange]);

    return (
        <div className="flex flex-wrap items-center gap-4">
            {/* Currency Field */}
            <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <div className="flex flex-col">
                    <Label className="text-xs text-gray-500">Currency</Label>
                    {isCurrenciesLoading ? (
                        <span className="text-sm text-gray-500">Loading...</span>
                    ) : (
                        <Select
                            value={currency}
                            onValueChange={(value) => {
                                setCurrency(value);
                                setBankAccountId(undefined);
                                setCashAccountId(undefined);
                            }}
                        >
                            <SelectTrigger className="w-[120px] h-8 text-sm border-gray-200 bg-gray-50">
                                <SelectValue placeholder="Currency" />
                            </SelectTrigger>
                            <SelectContent>
                                {currencies?.map((curr: any) => (
                                    <SelectItem key={curr.code} value={curr.code}>
                                        {curr.code}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* Date Field */}
            <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div className="flex flex-col">
                    <Label className="text-xs text-gray-500">Date</Label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-[140px] h-8 text-sm border border-gray-200 rounded-md px-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Agent Name Field (Read-only) */}
            <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <div className="flex flex-col">
                    <Label className="text-xs text-gray-500">Agent</Label>
                    <div className="text-sm text-gray-700 font-medium h-8 flex items-center">
                        {agentNameFromUser}
                    </div>
                </div>
            </div>

            {/* Payment Account Field */}
            <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <div className="flex flex-col">
                    <Label className="text-xs text-gray-500">Payment Account</Label>
                    <div className="flex items-center gap-2">
                        {/* Account Type Selector */}
                        <Select
                            value={paymentAccountType || ''}
                            onValueChange={(value) => {
                                setPaymentAccountType(value as 'BANK' | 'CASH');
                                setBankAccountId(undefined);
                                setCashAccountId(undefined);
                            }}
                        >
                            <SelectTrigger className="w-[130px] h-8 text-sm border-gray-200 bg-gray-50">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BANK">Bank Account</SelectItem>
                                <SelectItem value="CASH">Cash Account</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Account Selector based on type */}
                        {paymentAccountType === 'BANK' && (
                            <Select
                                value={bankAccountId?.toString() || ''}
                                onValueChange={(value) => setBankAccountId(parseInt(value))}
                                disabled={isBankAccountsLoading}
                            >
                                <SelectTrigger className="w-[160px] h-8 text-sm border-gray-200 bg-gray-50">
                                    <SelectValue placeholder="Select bank" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredBankAccounts.map((account: BankAccount) => (
                                        <SelectItem key={account.id} value={account.id.toString()}>
                                            {account.accountName} ({account.balance} {account.currency})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {paymentAccountType === 'CASH' && (
                            <Select
                                value={cashAccountId?.toString() || ''}
                                onValueChange={(value) => setCashAccountId(parseInt(value))}
                                disabled={isCashAccountsLoading}
                            >
                                <SelectTrigger className="w-[160px] h-8 text-sm border-gray-200 bg-gray-50">
                                    <SelectValue placeholder="Select cash" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredCashAccounts.map((account: CashAccount) => (
                                        <SelectItem key={account.id} value={account.id.toString()}>
                                            {account.accountName} ({account.balance} {account.currency})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {/* Show selected account info */}
                        {selectedAccount && (
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                Balance: {selectedAccount.balance} {selectedAccount.currency}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}