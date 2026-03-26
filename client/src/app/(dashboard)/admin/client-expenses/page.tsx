"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import {
    useGetClientExpenseQuery,
    useGetClientExpensesQuery,
} from "@/state/api";
import { skipToken } from "@reduxjs/toolkit/query/react";
import {ClientExpense} from "@/types/prismaTypes";
import {ClientExpenseFilters} from "@/state";

import ClientExpenseForm from "@/app/(dashboard)/admin/client-expenses/components/ClientExpenseForm";
import SearchInput from "@/app/(dashboard)/admin/client-expenses/components/SearchInput";
import UtilitiesTab from "@/app/(dashboard)/admin/client-expenses/components/[tabs]/UtilitiesTab";
import ClientExpenseList, {
    ClientExpenseListProps
} from "@/app/(dashboard)/admin/client-expenses/components/ClientExpenseList";
import ClientExpenseDetails from "@/app/(dashboard)/admin/client-expenses/components/ClientExpenseDetails";

type TabType = "drafts" | "pending" | "approved" | "cancelled" | "rejected";

export default function ClientExpensesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [selectedExpense, setSelectedExpense] = useState<ClientExpense | null>(null);

    const [isCreating, setIsCreating] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("pending");
    const [searchTerm, setSearchTerm] = useState("");

    const tabToBackend = {
        pending: "pending",
        approved: "approved",
        drafts: "drafts",
        cancelled: "cancelled",
        rejected: "rejected",
    };

    const filters: ClientExpenseFilters = useMemo(
        () => ({
            page: 1,
            limit: 15,
            tab: activeTab,
            search: searchTerm || undefined,
        }),
        [activeTab, searchTerm]
    );

    // Main list
    const { data, isLoading, isFetching } = useGetClientExpensesQuery(filters);

    // Draft badge count
    const { data: draftData } = useGetClientExpensesQuery(
        { tab: "drafts", limit: 1 },
        { refetchOnMountOrArgChange: true }
    );
    const draftCount = draftData?.total || 0;

    // Deep link support (?expenseId=123)
    const expenseId = searchParams.get("expenseId");
    const { data: expenseFromUrl } = useGetClientExpenseQuery(
        expenseId ? Number(expenseId) : skipToken
    );

    useEffect(() => {
        if (expenseId && expenseFromUrl) {
            setSelectedExpense(expenseFromUrl);
            setIsCreating(false);
            router.replace("/admin/client-expenses", { scroll: false });
        }
    }, [expenseId, expenseFromUrl, router]);

    const handleNewExpense = () => {
        setIsCreating(true);
        setSelectedExpense(null);
    };

    const handleSelectExpense: ClientExpenseListProps["onSelect"] = (item) => {
        if ("page" in item) return;
        setSelectedExpense(item);
        setIsCreating(false);
    };


    const handleBackToList = (tab?: TabType) => {
        setSelectedExpense(null);
        setIsCreating(false);
        if (tab) {
            setActiveTab(tab);
        }
    };

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setSelectedExpense(null);
        setIsCreating(false);
        setSearchTerm("");
    };

    const isViewingDetails = !!selectedExpense || isCreating;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="border-b border-gray-200 bg-white">
                <UtilitiesTab />
            </div>

            <div className="flex-1 overflow-hidden">
                {isViewingDetails ? (
                    <div className="h-full bg-white">
                        {isCreating ? (
                            <ClientExpenseForm expense={null} onClose={handleBackToList} />
                        ) : selectedExpense ? (
                            <ClientExpenseDetails
                                expense={selectedExpense}
                                onBack={handleBackToList}
                            />
                        ) : null}
                    </div>
                ) : (
                    <div className="h-full flex flex-col bg-gray-50">
                        {/* Header */}
                        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                            <div className="px-8 py-5 flex items-center justify-between">
                                {/* Tabs */}
                                <div className="flex space-x-3">
                                    {(
                                        [
                                            { key: "pending" as const,   label: "Pending",   badge: 0 },
                                            { key: "approved" as const,  label: "Approved",  badge: 0 },
                                            { key: "cancelled" as const, label: "Cancelled", badge: 0 },
                                            { key: "rejected" as const, label: "Rejected", badge: 0 },
                                            { key: "drafts" as const,    label: "Drafts",    badge: draftCount },
                                        ]
                                    ).map(({ key, label, badge }) => (
                                        <button
                                            key={key}
                                            onClick={() => handleTabChange(key)}
                                            className={`relative px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                                                activeTab === key
                                                    ? "bg-[#800000] text-white shadow-sm"
                                                    : "text-gray-700 hover:bg-gray-100"
                                            }`}
                                        >
                                            {label}
                                            {badge > 0 && activeTab !== key && (
                                                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-[#800000] text-white">
                                                    {badge}
                                                </Badge>
                                            )}
                                            {badge > 0 && activeTab === key && (
                                                <span className="ml-2 text-xs opacity-90 text-white">({badge})</span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Search */}
                                <div className="flex-1 max-w-2xl mx-8">
                                    <SearchInput
                                        onSearch={setSearchTerm}
                                        searchValue={searchTerm}
                                        placeholder="Search by candidate, client, institution..."
                                    />
                                </div>

                                {/* Create Button */}
                                <Button
                                    onClick={handleNewExpense}
                                    size="lg"
                                    className="bg-[#800000] hover:bg-[#6b0000] text-white font-medium"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Create Expense
                                </Button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto px-6 py-6">
                            <ClientExpenseList
                                filters={filters}
                                onSelect={handleSelectExpense}
                                selectedExpenseId={selectedExpense?.id ?? null}
                                isLoading={isLoading || isFetching}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
