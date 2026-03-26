'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const commonBanksInKenya = [
    { id: 1, name: 'KCB Bank', logo: '/assets/banks/kcb.png' },
    { id: 2, name: 'Equity Bank', logo: '/assets/banks/equity.png' },
    { id: 3, name: 'Cooperative Bank', logo: '/assets/banks/coop.jpg' },
    { id: 4, name: 'Standard Chartered', logo: '/assets/banks/standard-chartered.png' },
    { id: 5, name: 'Absa Bank', logo: '/assets/banks/absa.jpg' },
    { id: 6, name: 'NCBA Bank', logo: '/assets/banks/ncba.png' },
    { id: 7, name: 'Stanbic Bank', logo: '/assets/banks/stanbic.jpg' },
    { id: 8, name: 'DTB Bank', logo: '/assets/banks/dtb.png' },
    { id: 9, name: 'I&M Bank', logo: '/assets/banks/im.png' },
    { id: 10, name: 'M-Pesa (Safaricom)', logo: '/assets/banks/mpesa.png' },
];

export default function BankSelection() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

    const filteredBanks = commonBanksInKenya.filter((bank) =>
        bank.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleBankSelect = (bankName: string) => {
        setIsLoading(true);
        setTimeout(() => {
            router.push(`/admin/banking/connect-bank/${bankName.toLowerCase().replace(/\s+/g, '-')}`);
        }, 300);
    };

    const handleManualConnect = () => {
        setIsLoading(true);
        router.push('/admin/banking/connect-manually');
    };

    const handleImgError = (id: number) => {
        setImgErrors((prev) => ({ ...prev, [id]: true }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/admin/banking')}
                        className="flex items-center text-primary-700 hover:text-primary-800 transition-colors mb-6"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                        Back to Banking
                    </button>

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-primary-800 mb-2">Select Your Bank</h1>
                        <p className="text-primary-700">
                            Choose your bank to securely connect your accounts
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative max-w-2xl mx-auto mb-8">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search for your bank..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-4 rounded-xl border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm"
                        />
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 flex items-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mr-3"></div>
                            <span className="text-primary-700">Connecting to bank...</span>
                        </div>
                    </div>
                )}

                {/* Bank Grid */}
                <div className="mb-12">
                    {filteredBanks.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredBanks.map((bank) => (
                                <div
                                    key={bank.id}
                                    onClick={() => handleBankSelect(bank.name)}
                                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl cursor-pointer transform hover:-translate-y-1 transition-all duration-200 border border-primary-100 hover:border-primary-300 group"
                                >
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-primary-50 rounded-lg p-3 mb-4 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                                            {!imgErrors[bank.id] ? (
                                                <img
                                                    src={bank.logo}
                                                    alt={`${bank.name} logo`}
                                                    className="h-10 w-10 object-contain"
                                                    onError={() => handleImgError(bank.id)}
                                                />
                                            ) : (
                                                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                    {bank.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-primary-800 font-semibold mb-2 group-hover:text-primary-900 transition-colors">
                                            {bank.name}
                                        </h3>
                                        <div className="flex items-center text-sm text-primary-600">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                            </svg>
                                            Secure connection
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-primary-100">
                            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-primary-800 mb-2">No banks found</h3>
                            <p className="text-primary-700 mb-6">
                                We couldn&#39;t find any banks matching your search. Try a different search term or connect manually.
                            </p>
                            <button
                                onClick={handleManualConnect}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                Connect Manually
                            </button>
                        </div>
                    )}
                </div>

                {/* Manual Connection Option */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-primary-100">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="flex items-center mb-4 md:mb-0">
                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-primary-800">Don&#39;t see your bank?</h3>
                                <p className="text-primary-700">You can connect your account manually</p>
                            </div>
                        </div>
                        <button
                            onClick={handleManualConnect}
                            className="px-6 py-3 bg-white border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors shadow-sm"
                        >
                            Connect Manually
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
