'use client';

import { OperationalExpense } from '@/state';
import { formatEnumString, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface OverviewTabProps {
    expense: OperationalExpense;
}

export default function OverviewTab({ expense }: OverviewTabProps) {
    const paymentAccountType = expense.bankAccountId ? 'BANK' : expense.cashAccountId ? 'CASH' : 'N/A';

    return (
        <div className="space-y-6">
            <Card className="p-6 bg-primary-50">
                <h3 className="text-lg font-semibold text-primary-800 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm text-primary-600">Amount</p>
                        <p className="font-medium text-primary-800">
                            {expense.currency} {expense.amount ? Number(expense.amount).toFixed(2) : 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-primary-600">Date</p>
                        <p className="font-medium text-primary-800">{expense.date ? formatDate(expense.date) : 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-primary-600">Status</p>
                        <p className="font-medium text-primary-800">{expense.expenseStatus ? formatEnumString(expense.expenseStatus) : 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-primary-600">Reference</p>
                        <p className="font-medium text-primary-800">{expense.referenceNumber ?? 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-primary-600">Created By</p>
                        <p className="font-medium text-primary-800">
                            {expense.createdByAdmin?.name ||
                                expense.createdByAccounts?.name ||
                                expense.createdByStaff?.name ||
                                'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-primary-600">Approved By</p>
                        <p className="font-medium text-primary-800">
                            {expense.approvedByAdmin?.name ||
                                expense.approvedByAccounts?.name ||
                                expense.approvedByStaff?.name ||
                                'N/A'}
                        </p>
                    </div>
                </div>
            </Card>
            <Card className="p-6 bg-primary-50">
                <h3 className="text-lg font-semibold text-primary-800 mb-4">Item Type</h3>
                <p className="font-medium text-primary-800">{expense.itemType ? formatEnumString(expense.itemType) : 'N/A'}</p>
            </Card>
            <Card className="p-6 bg-primary-50">
                <h3 className="text-lg font-semibold text-primary-800 mb-4">Purchase Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm text-primary-600">Expense Category</p>
                        <p className="font-medium text-primary-800">{expense.accountType ? formatEnumString(expense.accountType) : 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-primary-600">Payment Account</p>
                        <p className="font-medium text-primary-800">
                            {paymentAccountType === 'BANK' && expense.bankAccount
                                ? `${expense.bankAccount.accountName} (${expense.bankAccount.accountNumber})`
                                : paymentAccountType === 'CASH' && expense.cashAccount
                                    ? `${expense.cashAccount.accountName} (${expense.cashAccount.accountNumber})`
                                    : 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-primary-600">Account Balance</p>
                        <p className="font-medium text-primary-800">
                            {expense.bankAccount
                                ? `${expense.bankAccount.currency} ${expense.bankAccount.balance}`
                                : expense.cashAccount
                                    ? `${expense.cashAccount.currency} ${expense.cashAccount.balance}`
                                    : 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-primary-600">Agent Name</p>
                        <p className="font-medium text-primary-800">{expense.agentName ?? 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-primary-600">KRA PIN</p>
                        <p className="font-medium text-primary-800">{expense.kraPin ?? 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-primary-600">Institution Name</p>
                        <p className="font-medium text-primary-800">{expense.institutionName ?? 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-primary-600">Supplier</p>
                        <p className="font-medium text-primary-800">{expense.supplier?.name ?? 'N/A'}</p>
                    </div>
                </div>
            </Card>
            <Card className="p-6 bg-primary-50">
                <h3 className="text-lg font-semibold text-primary-800 mb-4">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm text-primary-600">Reason for Payment</p>
                        <p className="font-medium text-primary-800">{expense.reasonForPayment ?? 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-primary-600">Frequency</p>
                        <p className="font-medium text-primary-800">{expense.frequency ? formatEnumString(expense.frequency) : 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-primary-600">Payment Mode</p>
                        <p className="font-medium text-primary-800">{expense.paymentMode ? formatEnumString(expense.paymentMode) : 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-primary-600">Payment Mode Description</p>
                        <p className="font-medium text-primary-800">{expense.paymentModeDescription ?? 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-primary-600">Payment Status</p>
                        <p className="font-medium text-primary-800">{expense.paymentStatus ? formatEnumString(expense.paymentStatus) : 'N/A'}</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}