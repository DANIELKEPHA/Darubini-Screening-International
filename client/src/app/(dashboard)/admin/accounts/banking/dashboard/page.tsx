'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BankAccount, Transaction, TransactionFilters } from '@/state';
import SearchInput from "@/app/(dashboard)/admin/accounts/banking/components/SearchInput";
import BankAccountList from "@/app/(dashboard)/admin/accounts/banking/components/BankAccountList";
import TransactionList from "@/app/(dashboard)/admin/accounts/banking/components/TransactionList";
import ReconciliationView from "@/app/(dashboard)/admin/accounts/banking/components/ReconciliationView";
import PaymentModal from "@/app/(dashboard)/admin/accounts/banking/components/PaymentModal";
import TransactionDetails from "@/app/(dashboard)/admin/accounts/banking/components/TransactionDetails";
import BankAccountDetails from "@/app/(dashboard)/admin/accounts/banking/components/BankAccountDetails";

export default function BankingDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'accounts' | 'transactions' | 'reconciliation'>('accounts');
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);
    const [transactionFilters, setTransactionFilters] = useState<TransactionFilters>({ page: 1, limit: 10 });

    const handleTabChange = (tab: 'accounts' | 'transactions' | 'reconciliation') => {
        setActiveTab(tab);
        setSelectedAccount(null);
        setSelectedTransaction(null);
    };

    const handleSearch = (search: string) => {
        setTransactionFilters((prev) => ({ ...prev, search, page: 1 }));
        setSelectedTransaction(null);
    };

    const handlePageChange = (page: number) => {
        setTransactionFilters((prev) => ({ ...prev, page }));
    };

    return (
        <div className="container mx-auto p-6 flex flex-col md:flex-row gap-6 min-h-screen bg-gray-100">
            <div className="w-full md:w-1/3 bg-white rounded-lg shadow-lg p-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold text-gray-800">Banking</h1>
                </div>
                <div className="border-b border-gray-200 mb-4">
                    <nav className="-mb-px flex space-x-4">
                        <button
                            className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                                activeTab === 'accounts'
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                            onClick={() => handleTabChange('accounts')}
                        >
                            Accounts
                        </button>
                        <button
                            className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                                activeTab === 'transactions'
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                            onClick={() => handleTabChange('transactions')}
                        >
                            Transactions
                        </button>
                        <button
                            className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                                activeTab === 'reconciliation'
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                            onClick={() => handleTabChange('reconciliation')}
                        >
                            Reconciliation
                        </button>
                    </nav>
                </div>
                {activeTab === 'transactions' && (
                    <SearchInput onSearch={handleSearch} searchValue={transactionFilters.search || ''} />
                )}
                {activeTab === 'accounts' && (
                    <BankAccountList
                        onSelect={setSelectedAccount}
                        selectedAccountId={selectedAccount?.id}
                    />
                )}
                {activeTab === 'transactions' && (
                    <TransactionList
                        filters={transactionFilters}
                        onSelect={setSelectedTransaction}
                        selectedTransactionId={selectedTransaction?.id}
                        onInitiatePayment={() => setIsInitiatingPayment(true)}
                        onPageChange={handlePageChange}
                    />
                )}
                {activeTab === 'reconciliation' && <ReconciliationView />}
            </div>
            <div className="w-full md:w-2/3 bg-white rounded-lg shadow-lg p-6">
                {isInitiatingPayment ? (
                    <PaymentModal
                        transaction={selectedTransaction}
                        onClose={() => setIsInitiatingPayment(false)}
                    />
                ) : selectedTransaction ? (
                    <TransactionDetails
                        transaction={selectedTransaction}
                        onEdit={() => setIsInitiatingPayment(true)}
                        onClose={() => setSelectedTransaction(null)}
                    />
                ) : selectedAccount ? (
                    <BankAccountDetails
                        account={selectedAccount}
                        onEdit={() => router.push('/admin/banking/connect-manually')}
                        onClose={() => setSelectedAccount(null)}
                    />
                ) : (
                    <div className="text-gray-500 text-center py-10">
                        Select an account or transaction to view details
                    </div>
                )}
            </div>
        </div>
    );
}