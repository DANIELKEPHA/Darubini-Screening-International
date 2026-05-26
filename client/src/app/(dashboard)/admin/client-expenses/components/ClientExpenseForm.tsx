"use client";

import React from "react";
import { useSelector } from "react-redux";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    useCreateClientExpenseMutation,
    useUpdateClientExpenseMutation,
    useGetCurrenciesQuery,
    useGetClientsQuery,
    useGetAuthUserQuery,
} from "@/state/api";
import { formatEnumString, withToast } from "@/lib/utils";
import { calculateMpesaFee } from "@/lib/mpesa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ChevronLeft, X, User, Calendar as CalendarIcon, Plus } from "lucide-react";
import {
    PaymentMode,
    ExpenseCheck,
    ClientExpense,
    ExpenseStatus,
} from "@/state";
import { ClientList } from "@/state/types";
import ConfirmDialog from "@/app/(dashboard)/admin/client-expenses/components/ConfirmDialog";
import {ClientExpenseFormData, clientExpenseSchema} from "@/lib/schemas";
import ClientForm from "@/app/(dashboard)/[slag]/cl/ClientForm";

const DEFAULT_EXPENSE_CHECK = Object.values(ExpenseCheck)[0] || "IDENTITY";
const NONE_VALUE = "NONE";
const PAYMENT_MODE_DISPLAY: Record<string, string> = { MPESA_PAYBILL: "Mpesa" };

interface ClientExpenseFormProps {
    expense?: any | null;
    initialData?: ClientExpense | null;
    isEditMode?: boolean;
    onClose: () => void;
}

export default function ClientExpenseForm({
                                              expense,
                                              initialData,
                                              isEditMode = false,
                                              onClose,
                                          }: ClientExpenseFormProps) {
    const expenseForId = (initialData || expense) as ClientExpense | null;
    const isEditing = !!expenseForId?.id;

    const { data: authUser } = useGetAuthUserQuery();
    const agentNameFromUser =
        authUser?.userInfo?.name || authUser?.userInfo?.email?.split("@")[0] || "User";

    const [date, setDate] = React.useState<Date>(() => {
        if (expenseForId?.date) {
            const d = new Date(expenseForId.date);
            return isNaN(d.getTime()) ? new Date() : d;
        }
        return new Date();
    });

    const userRole = useSelector((state: any) => state.global.user?.role);
    const isStaff = userRole === "staff";

    const { data: currencies, isLoading: isCurrenciesLoading } = useGetCurrenciesQuery();
    const { data: clientData = { clients: [] }, isLoading: isClientsLoading } =
        useGetClientsQuery({ page: 1, limit: 100 });

    const [createClientExpense, { isLoading: isCreating }] = useCreateClientExpenseMutation();
    const [updateClientExpense, { isLoading: isUpdating }] = useUpdateClientExpenseMutation();

    const [taxRate, setTaxRate] = React.useState(0);
    const [isAddingClient, setIsAddingClient] = React.useState(false);

    // Confirmation dialog states
    const [showCancelDialog, setShowCancelDialog] = React.useState(false);
    const [showSaveDialog, setShowSaveDialog] = React.useState(false);

    const {
        control,
        handleSubmit,
        setValue,
        watch,
        getValues,
        formState: { errors, isDirty },
    } = useForm<ClientExpenseFormData>({
        resolver: zodResolver(clientExpenseSchema),
        defaultValues: {
            candidateName: expenseForId?.candidateName || "",
            clientListId: expenseForId?.clientListId || 0,
            institutionName: expenseForId?.institutionName || "",
            paymentMode: expenseForId?.paymentMode || PaymentMode.CASH,
            paymentModeDescription: expenseForId?.paymentModeDescription || "",
            amount: expenseForId?.amount || 0,
            currency: expenseForId?.currency || "KES",
            expenseCheck: expenseForId?.expenseCheck || DEFAULT_EXPENSE_CHECK,
            totalAmountPaid: expenseForId?.totalAmountPaid || 0,
        },
    });

    const watchedAmount = watch("amount");
    const watchedPaymentMode = watch("paymentMode");

    React.useEffect(() => {
        const amount = watchedAmount || 0;
        const mode = watchedPaymentMode;
        let mpesaFee = 0;
        let taxAmount = 0;
        let total = amount;

        if (mode === PaymentMode.MPESA_PAYBILL) {
            mpesaFee = calculateMpesaFee(amount);
            taxAmount = Number((mpesaFee * taxRate / 100).toFixed(2));
            total = amount + mpesaFee + taxAmount;
        } else {
            taxAmount = Number((amount * taxRate / 100).toFixed(2));
            total = amount + taxAmount;
        }

        setValue("totalAmountPaid", total);
    }, [watchedAmount, watchedPaymentMode, taxRate, setValue]);

    const currentAmount = Number(watchedAmount ?? 0);
    const currentMode = watchedPaymentMode ?? PaymentMode.CASH;
    const isMpesa = currentMode === PaymentMode.MPESA_PAYBILL;
    const mpesaFee = isMpesa ? calculateMpesaFee(currentAmount) : 0;

    const taxOnFee = Number((mpesaFee * taxRate / 100).toFixed(2));
    const taxOnAmount = Number((currentAmount * taxRate / 100).toFixed(2));

    const totalAmount = Number(getValues("totalAmountPaid") ?? currentAmount);

    const onSubmit = async (formData: ClientExpenseFormData) => {
        try {
            const formattedDate = date.toISOString().split("T")[0];
            const payload = {
                ...formData,
                agentName: agentNameFromUser,
                date: formattedDate,
                clientListId: Number(formData.clientListId),
                totalAmountPaid: formData.totalAmountPaid || formData.amount,
                paymentMode: formData.paymentMode as PaymentMode,
                expenseCheck: formData.expenseCheck as ExpenseCheck | undefined,
            };

            let mutationPromise;
            if (isEditing && expenseForId?.id) {
                mutationPromise = updateClientExpense({ id: expenseForId.id, data: payload }).unwrap();
            } else {
                mutationPromise = createClientExpense({ ...payload, expenseStatus: ExpenseStatus.PENDING }).unwrap();
            }

            await withToast(mutationPromise, {
                pending: isEditing ? "Updating expense..." : "Creating expense...",
                success: isEditing ? "Expense updated!" : "Expense created!",
                error: "Failed to save expense",
            });

            onClose();
        } catch (err) {
            console.error("Submission failed:", err);
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Sticky Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-8 py-4">
                <div className="flex items-center justify-between">
                    <Button
                        onClick={() => (isDirty ? setShowCancelDialog(true) : onClose())}
                        variant="ghost"
                        className="h-10 px-4 rounded-lg"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 min-w-[160px]">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{agentNameFromUser}</span>
                        </div>

                        {/* Client Selector */}
                        <div className="min-w-[200px]">
                            <Controller
                                name="clientListId"
                                control={control}
                                render={({ field }) => (
                                    <>
                                        {isClientsLoading ? (
                                            <div className="h-10 rounded-lg border border-gray-300 bg-gray-50 flex items-center px-3">
                                                <span className="text-sm text-gray-500">Loading clients...</span>
                                            </div>
                                        ) : clientData.clients.length > 0 ? (
                                            <Select
                                                onValueChange={(val) => {
                                                    const numVal = Number(val);
                                                    field.onChange(numVal);
                                                    const client = clientData.clients.find((c) => c.id === numVal);
                                                    if (client) {
                                                        setValue("clientName", client.clientName || client.customClientName || "");
                                                    }
                                                }}
                                                value={field.value ? field.value.toString() : undefined}
                                            >
                                                <SelectTrigger className="h-10 rounded-lg border-gray-300">
                                                    <SelectValue placeholder="Select client" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {clientData.clients.map((client: ClientList) => (
                                                        <SelectItem key={client.id} value={client.id.toString()}>
                                                            {client.clientName || client.customClientName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div
                                                className="h-10 rounded-lg border-2 border-dashed border-blue-400 bg-blue-50 flex items-center justify-between px-4 cursor-pointer hover:bg-blue-100 transition-colors"
                                                onClick={() => setIsAddingClient(true)}
                                            >
                                                <span className="text-sm font-medium text-blue-800">No clients yet</span>
                                                <div className="flex items-center gap-2 text-blue-700 font-medium">
                                                    <Plus className="w-4 h-4" />
                                                    <span>Add Client</span>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            />
                            {errors.clientListId && (
                                <p className="text-xs text-red-500 mt-1">Please select a client</p>
                            )}
                        </div>

                        {/* Expense Check */}
                        <div className="min-w-[140px]">
                            <Controller
                                name="expenseCheck"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={(v) => field.onChange(v === NONE_VALUE ? undefined : v)}
                                        value={field.value || NONE_VALUE}
                                    >
                                        <SelectTrigger className="h-10 rounded-lg border-gray-300">
                                            <SelectValue placeholder="Expense type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(ExpenseCheck).map((check) => (
                                                <SelectItem key={check} value={check}>
                                                    {formatEnumString(check)}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value={NONE_VALUE}>None</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        {/* Currency */}
                        <div className="min-w-[120px]">
                            {isCurrenciesLoading ? (
                                <div className="h-10 rounded-lg border border-gray-300 bg-gray-100 flex items-center px-3">
                                    <span className="text-sm text-gray-500">Loading...</span>
                                </div>
                            ) : (
                                <Controller
                                    name="currency"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger className="h-10 rounded-lg border-gray-300">
                                                <SelectValue placeholder="Currency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {currencies?.map((curr: any) => (
                                                    <SelectItem key={curr.code} value={curr.code}>
                                                        {curr.name} ({curr.code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            )}
                        </div>

                        {/* Date Picker */}
                        <div className="min-w-[140px]">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="h-10 rounded-lg border-gray-300 justify-start font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "dd/MM/yy") : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-lg" align="end">
                                    <Calendar mode="single" selected={date} onSelect={(d) => setDate(d || new Date())} />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Client Modal */}
            {isAddingClient && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Create New Client</h2>
                            <Button variant="ghost" size="sm" onClick={() => setIsAddingClient(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="p-6">
                            <ClientForm onClose={() => setIsAddingClient(false)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto p-0">
                <form onSubmit={handleSubmit(onSubmit)} className="h-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
                        {/* Left Column - Inputs */}
                        <div className="bg-gray-50 p-6 border-r border-gray-200">
                            <div className="max-w-md mx-auto space-y-5">
                                {/* Candidate Name */}
                                <div className="flex items-center gap-3">
                                    <Label className="min-w-[120px] text-sm font-medium text-gray-700">Candidate Name</Label>
                                    <Controller
                                        name="candidateName"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                className="h-11 flex-1 border-0 border-b-2 border-gray-300 bg-transparent rounded-none px-0 shadow-sm focus:border-blue-500 focus:ring-0 focus:shadow-md transition-all duration-200"
                                                placeholder="Please enter all candidate names"
                                            />
                                        )}
                                    />
                                </div>
                                {errors.candidateName && <p className="text-xs text-red-500 ml-[135px]">{errors.candidateName.message}</p>}

                                {/* Institution Name */}
                                <div className="flex items-center gap-3">
                                    <Label className="min-w-[120px] text-sm font-medium text-gray-700">Institution Name</Label>
                                    <Controller
                                        name="institutionName"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                className="h-11 flex-1 border-0 border-b-2 border-gray-300 bg-transparent rounded-none px-0 shadow-sm focus:border-blue-500 focus:ring-0 focus:shadow-md transition-all duration-200"
                                                placeholder="Enter institution"
                                            />
                                        )}
                                    />
                                </div>
                                {errors.institutionName && <p className="text-xs text-red-500 ml-[135px]">{errors.institutionName.message}</p>}

                                {/* Payment Mode */}
                                <div className="flex items-center gap-3">
                                    <Label className="min-w-[140px] text-sm font-medium text-gray-700">Payment Mode</Label>
                                    <Controller
                                        name="paymentMode"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger className="flex-1 h-11 border-0 border-b-2 border-gray-300 bg-transparent rounded-none px-0 shadow-sm focus:border-blue-500 focus:ring-0 focus:shadow-md transition-all duration-200">
                                                    <SelectValue placeholder="Select payment mode" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.values(PaymentMode).map((mode) => (
                                                        <SelectItem key={mode} value={mode}>
                                                            {PAYMENT_MODE_DISPLAY[mode] || formatEnumString(mode)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>

                                {/* Payment Details */}
                                <div className="flex items-start gap-3">
                                    <Label className="min-w-[140px] text-sm font-medium text-gray-700 pt-3">Payment Details</Label>
                                    <Controller
                                        name="paymentModeDescription"
                                        control={control}
                                        render={({ field }) => (
                                            <textarea
                                                {...field}
                                                className="flex-1 min-h-[80px] p-0 border-0 border-b-2 border-gray-300 bg-transparent rounded-none resize-none shadow-sm focus:border-blue-500 focus:ring-0 focus:shadow-md transition-all duration-200"
                                                placeholder="e.g. Phone number, Bank ref, etc."
                                            />
                                        )}
                                    />
                                </div>

                                {/* Amount */}
                                <div className="flex items-center gap-3">
                                    <Label className="min-w-[70px] text-sm font-medium text-gray-700">Amount</Label>
                                    <Controller
                                        name="amount"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                type="number"
                                                step="0.01"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                className="h-11 border-0 border-b-2 border-gray-300 bg-transparent rounded-none px-0 shadow-sm focus:border-blue-500 focus:ring-0 focus:shadow-md transition-all duration-200"
                                                placeholder="0.00"
                                            />
                                        )}
                                    />
                                </div>
                                {errors.amount && <p className="text-xs text-red-500 ml-[85px]">{errors.amount.message}</p>}
                            </div>
                        </div>

                        {/* Right Column - Summary */}
                        <div className="bg-white p-8">
                            <div className="max-w-md mx-auto">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Summary</h3>
                                <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-medium">Tax Rate (%)</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            value={taxRate}
                                            onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                                            className="w-28 h-10 text-right"
                                        />
                                    </div>
                                    <div className="text-sm space-y-3 pt-4 border-t border-indigo-200">
                                        <div className="flex justify-between">
                                            <span>Base amount:</span>
                                            <span className="font-medium">{currentAmount.toFixed(2)} KES</span>
                                        </div>
                                        {isMpesa && (
                                            <div className="flex justify-between">
                                                <span>M-Pesa transaction fee:</span>
                                                <span className="font-medium">{mpesaFee.toFixed(2)} KES</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span>Tax ({taxRate}%){isMpesa ? " on fee" : " on amount"}:</span>
                                            <span className="font-medium">
                        {(isMpesa ? taxOnFee : taxOnAmount).toFixed(2)} KES
                      </span>
                                        </div>
                                        <div className="flex justify-between font-bold text-lg pt-4 border-t border-indigo-300">
                                            <span>Total to pay:</span>
                                            <span className="text-green-700 font-bold">{totalAmount.toFixed(2)} KES</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 text-xs text-gray-500">
                                    {isMpesa
                                        ? "M-Pesa fee is charged by Safaricom. Tax applies only on the fee."
                                        : "Tax is applied on the full amount for non-M-Pesa payments."}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-6">
                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => (isDirty ? setShowCancelDialog(true) : onClose())}
                                className="h-11 px-6 rounded-lg"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>

                            {!isStaff && (
                                <Button
                                    type="button"
                                    onClick={() => {
                                        if (isDirty) {
                                            setShowSaveDialog(true);
                                        } else {
                                            handleSubmit(onSubmit)();
                                        }
                                    }}
                                    disabled={isCreating || isUpdating}
                                    className="h-11 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {isCreating || isUpdating
                                        ? "Saving..."
                                        : isEditing
                                            ? "Update Expense"
                                            : "Create Expense"}
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            {/* Confirmation Dialogs */}
            <ConfirmDialog
                open={showCancelDialog}
                title="Discard changes?"
                description="You have unsaved changes. Are you sure you want to leave without saving?"
                confirmText="Discard & Leave"
                cancelText="Stay here"
                variant="destructive"
                onConfirm={() => {
                    setShowCancelDialog(false);
                    onClose();
                }}
                onCancel={() => setShowCancelDialog(false)}
            />

            <ConfirmDialog
                open={showSaveDialog}
                title={isEditing ? "Update Expense?" : "Create New Expense?"}
                description="This will save your changes permanently."
                confirmText="Yes, Save"
                cancelText="No, Review"
                onConfirm={() => {
                    setShowSaveDialog(false);
                    handleSubmit(onSubmit)();
                }}
                onCancel={() => setShowSaveDialog(false)}    
            />
        </div>
    );
}