"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Download, Calendar } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useGetClientExpensesQuery, useDownloadClientExpensesXlsxMutation } from "@/state/api";
import type { ClientExpense, ClientExpenseFilters } from "@/state/types";
import { useState } from "react";

export interface ClientExpenseListProps {
    filters: ClientExpenseFilters;
    onSelect: (item: ClientExpense | Partial<ClientExpenseFilters>) => void;
    selectedExpenseId?: number | null;
    isLoading?: boolean;
}

export default function ClientExpenseList({
                                              filters,
                                              onSelect,
                                              selectedExpenseId,
                                              isLoading: externalIsLoading,
                                          }: ClientExpenseListProps) {
    const { data: response, isLoading: queryIsLoading, isFetching } =
        useGetClientExpensesQuery(filters);

    const [downloadXlsx, { isLoading: isDownloadingXlsx }] = useDownloadClientExpensesXlsxMutation();

    const expenses: ClientExpense[] = response?.expenses ?? [];
    const totalPages = response?.totalPages ?? 1;
    const total = response?.total ?? 0;
    const currentPage = filters.page ?? 1;
    const isLoading = externalIsLoading ?? queryIsLoading;

    // Temporary range for picker (not applied until user confirms)
    const [tempRange, setTempRange] = useState<{
        from: Date | undefined;
        to: Date | undefined;
    }>({
        from: filters.period ? new Date(filters.period.split(",")[0]) : undefined,
        to: filters.period ? new Date(filters.period.split(",")[1]) : undefined,
    });

    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const handlePageChange = (page: number) => onSelect({ page });

    const handleExportXlsx = () => {
        downloadXlsx(filters);
    };

    const applyDateRange = () => {
        if (tempRange.from && tempRange.to) {
            const start = format(tempRange.from, "yyyy-MM-dd");
            const end = format(tempRange.to, "yyyy-MM-dd");
            onSelect({ period: `${start},${end}`, page: 1 });
        }
        setIsPickerOpen(false);
    };

    const clearDateRange = () => {
        setTempRange({ from: undefined, to: undefined });
        onSelect({ period: undefined, page: 1 });
        setIsPickerOpen(false);
    };

    const currentDisplayText = () => {
        if (filters.period) {
            const [start, end] = filters.period.split(",");
            return `${format(new Date(start), "dd MMM yyyy")} – ${format(new Date(end), "dd MMM yyyy")}`;
        }
        return "All Dates";
    };

    const getStatusBadge = (expense: ClientExpense) => {
        // ... (your existing badge logic unchanged)
        if (expense.expenseStatus === "CANCELLED") {
            return (
                <Badge variant="destructive" className="bg-red-100 text-red-800 border border-red-300">
                    Cancelled
                </Badge>
            );
        }
        if (expense.expenseStatus === "REJECTED") {
            return (
                <Badge className="bg-purple-100 text-purple-800 border border-purple-300">
                    Rejected
                </Badge>
            );
        }
        if (expense.expenseStatus === "APPROVED" && expense.paymentStatus === "PAID") {
            return (
                <Badge className="bg-green-100 text-green-800 border border-green-300">
                    Paid
                </Badge>
            );
        }
        return (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 border border-orange-300">
                Pending
            </Badge>
        );
    };

    // ... (error, loading, empty states unchanged)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Client Expenses</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        {total} expense{total !== 1 ? "s" : ""} • Page {currentPage} of {totalPages}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Date Range Picker with Apply/Clear */}
                    <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="gap-2 justify-start text-left font-normal">
                                <Calendar className="w-4 h-4" />
                                <span className="truncate">{currentDisplayText()}</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-4" align="end">
                            <DayPicker
                                mode="range"
                                selected={{ from: tempRange.from, to: tempRange.to }}
                                onSelect={(range) => {
                                    const typed = range as { from: Date | undefined; to: Date | undefined };
                                    setTempRange({ from: typed?.from, to: typed?.to });
                                }}
                                captionLayout="dropdown"
                                fromYear={2020}
                                toYear={new Date().getFullYear() + 1}
                                classNames={{
                                    caption_label: "text-sm font-medium",
                                }}
                            />

                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearDateRange}
                                    disabled={!tempRange.from && !tempRange.to && !filters.period}
                                >
                                    Clear
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={applyDateRange}
                                    disabled={!tempRange.from || !tempRange.to}
                                >
                                    Apply
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Export Button */}
                    <Button
                        onClick={handleExportXlsx}
                        disabled={isDownloadingXlsx || isFetching}
                        className="gap-2"
                    >
                        <Download className="w-4 h-4" />
                        {isDownloadingXlsx ? "Exporting..." : "Export to Excel"}
                    </Button>
                </div>
            </div>

            <Card className="border shadow-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50">
                                <TableHead className="font-semibold text-gray-700">Agent Name</TableHead>
                                <TableHead className="font-semibold text-gray-700">Candidate</TableHead>
                                <TableHead className="font-semibold text-gray-700">Client</TableHead>
                                <TableHead className="font-semibold text-gray-700">Check</TableHead>
                                <TableHead className="font-semibold text-gray-700">Institution</TableHead>
                                <TableHead className="font-semibold text-gray-700">Payment Mode</TableHead>
                                <TableHead className="text-right font-semibold text-gray-700">Total Paid</TableHead>
                                <TableHead className="font-semibold text-gray-700">Date</TableHead>
                                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.map((expense) => (
                                <TableRow
                                    key={expense.id}
                                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                                        selectedExpenseId === expense.id ? "bg-blue-50 font-medium" : ""
                                    }`}
                                    onClick={() => onSelect(expense)}
                                >
                                    <TableCell>{expense.agentName || "—"}</TableCell>
                                    <TableCell className="font-medium">{expense.candidateName}</TableCell>
                                    <TableCell>{expense.clientName || "—"}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={expense.expenseCheck ? "default" : "secondary"}
                                            className="text-xs font-medium text-white"
                                        >
                                            {expense.expenseCheck ? expense.expenseCheck.replace(/_/g, " ") : "Standard"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{expense.institutionName || "—"}</TableCell>
                                    <TableCell>
                                        {expense.paymentMode === "MPESA_PAYBILL"
                                            ? "Mpesa"
                                            : expense.paymentMode.replace(/_/g, " ")}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-green-700">
                                        {formatCurrency(expense.totalAmountPaid || expense.amount, expense.currency)}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {expense.date ? format(new Date(expense.date), "dd MMM yyyy") : "—"}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(expense)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <p className="text-gray-600">
                        Showing {expenses.length} of {total} expenses
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage <= 1 || isFetching}
                            onClick={() => handlePageChange(currentPage - 1)}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Previous
                        </Button>
                        <span className="px-3 text-gray-700 font-medium">
              Page {currentPage} of {totalPages}
            </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= totalPages || isFetching}
                            onClick={() => handlePageChange(currentPage + 1)}
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function formatCurrency(amount: number, currency = "KES") {
    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
    }).format(amount);
}