"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    User,
    Building2,
    Calendar,
    CreditCard,
    DollarSign,
    FileText,
    Edit3,
    Ban,
    Download,
    Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
    useCancelClientExpenseMutation,
    useApproveClientExpenseMutation,
    useRejectClientExpenseMutation,
    useDownloadClientExpensePdfMutation,
    useGetProofFilesQuery,
    useDeleteClientExpenseMutation, // ← Added real delete mutation
} from "@/state/api";
import type { ClientExpense } from "@/state/types";
import { calculateMpesaFee } from "@/lib/mpesa";
import { useState } from "react";
import { toast } from "sonner";
import ConfirmDialog from "@/app/(dashboard)/admin/client-expenses/components/ConfirmDialog";
import ApprovePaymentModal from "@/app/(dashboard)/admin/client-expenses/components/ApprovePaymentModal";
import ProofFilesSection from "@/app/(dashboard)/admin/client-expenses/components/ProofFilesSection";

type TabType = "drafts" | "pending" | "approved" | "cancelled" | "rejected";

interface ClientExpenseDetailsProps {
    expense: ClientExpense;
    onBack: (tab?: TabType) => void;
}

export default function ClientExpenseDetails({
                                                 expense,
                                                 onBack,
                                             }: ClientExpenseDetailsProps) {
    const router = useRouter();

    // Modal states
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isApprovePaymentModalOpen, setIsApprovePaymentModalOpen] =
        useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

    const [isCancelling, setIsCancelling] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    // RTK Mutations
    const [cancelExpense] = useCancelClientExpenseMutation();
    const [approveExpense] = useApproveClientExpenseMutation();
    const [rejectExpense] = useRejectClientExpenseMutation();
    const [deleteExpense] = useDeleteClientExpenseMutation(); // ← Real delete mutation
    const [downloadPdf, { isLoading: isDownloadingPdf }] =
        useDownloadClientExpensePdfMutation();

    // Proof files query
    const { data: proofFilesData, refetch: refetchProofFiles } =
        useGetProofFilesQuery({
            clientExpenseId: expense.id,
            limit: 50,
            page: 1,
        });
    const proofFiles = proofFilesData?.data || [];

    // Status helpers
    const isPaid = expense.paymentStatus === "PAID";
    const isCancelled = expense.expenseStatus === "CANCELLED";
    const isRejected = expense.expenseStatus === "REJECTED";
    const isFinalLocked = isCancelled || isRejected;

    const referenceNumber =
        expense.referenceNumber ||
        `DSIC${new Date(expense.date).getFullYear()}C${expense.id
            .toString()
            .padStart(6, "0")}`;

    const formatCurrency = (amount: number | null, currency = "KES") => {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
        }).format(amount || 0);
    };

    const getPaymentModeLabel = (mode: string) => {
        return mode === "MPESA_PAYBILL" ? "Mpesa" : mode.replace(/_/g, " ");
    };

    // Modal handlers
    const openCancelModal = () => setIsCancelModalOpen(true);
    const closeCancelModal = () => setIsCancelModalOpen(false);

    const openEditConfirm = () => setIsEditConfirmOpen(true);
    const closeEditConfirm = () => setIsEditConfirmOpen(false);

    const openDeleteConfirm = () => setIsDeleteConfirmOpen(true);
    const closeDeleteConfirm = () => setIsDeleteConfirmOpen(false);

    const openApprovePaymentModal = () => setIsApprovePaymentModalOpen(true);
    const closeApprovePaymentModal = () => setIsApprovePaymentModalOpen(false);

    const openRejectModal = () => setIsRejectModalOpen(true);
    const closeRejectModal = () => setIsRejectModalOpen(false);

    const handleCancelConfirm = async () => {
        setIsCancelling(true);
        try {
            await cancelExpense(expense.id).unwrap();
            toast.success("Expense cancelled successfully");
            closeCancelModal();
            onBack("cancelled");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to cancel expense");
        } finally {
            setIsCancelling(false);
        }
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            await deleteExpense(expense.id).unwrap();
            toast.success("Expense deleted successfully");
            closeDeleteConfirm();
            onBack(); // Go back to list
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to delete expense");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditConfirm = async () => {
        if (isPaid) {
            const confirmEdit = window.confirm(
                "This expense has already been paid. Any changes will be treated as a correction. Proceed with caution."
            );
            if (!confirmEdit) return;
        }
        closeEditConfirm();
        router.push(`/admin/client-expenses/components/${expense.id}/edit`);
    };

    const handleApproveWithAccount = async (cashAccountId: number) => {
        setIsApproving(true);
        try {
            await approveExpense({ id: expense.id, cashAccountId }).unwrap();
            toast.success("Expense approved and paid successfully!");
            closeApprovePaymentModal();
            onBack("approved");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to approve expense");
        } finally {
            setIsApproving(false);
        }
    };

    const handleRejectConfirm = async () => {
        setIsRejecting(true);
        try {
            await rejectExpense({ id: expense.id, data: {} }).unwrap();
            toast.success("Expense rejected");
            closeRejectModal();
            onBack("rejected");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to reject expense");
        } finally {
            setIsRejecting(false);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-gray-50/30 py-8 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <Button
                            onClick={() => onBack()}
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-primary hover:text-primary/80 hover:bg-primary/10"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to List
                        </Button>

                        <div className="flex items-center gap-3">
                            <Badge
                                variant={
                                    isCancelled || isRejected
                                        ? "destructive"
                                        : isPaid
                                            ? "default"
                                            : "secondary"
                                }
                                className={`px-4 py-2 text-sm font-semibold ${
                                    isCancelled
                                        ? "bg-red-100 text-red-800 border border-red-300"
                                        : isRejected
                                            ? "bg-purple-100 text-purple-800 border border-purple-300"
                                            : isPaid
                                                ? "bg-green-50 text-green-700 border border-green-200"
                                                : "bg-orange-50 text-orange-700 border border-orange-200"
                                }`}
                            >
                                {isCancelled
                                    ? "Cancelled"
                                    : isRejected
                                        ? "Rejected"
                                        : isPaid
                                            ? "Paid"
                                            : "Pending Payment"}
                            </Badge>

                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Download - always available */}
                                <Button
                                    onClick={() => downloadPdf(expense.id)}
                                    disabled={isDownloadingPdf}
                                    variant="outline"
                                    size="sm"
                                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                >
                                    {isDownloadingPdf ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4 mr-2" />
                                            PDF
                                        </>
                                    )}
                                </Button>

                                {/* Management actions: only if not cancelled/rejected */}
                                {!isFinalLocked && (
                                    <>
                                        {/* Edit */}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                            onClick={openEditConfirm}
                                        >
                                            <Edit3 className="w-4 h-4 mr-1.5" />
                                            Update
                                        </Button>

                                        {/* Cancel - only if not paid */}
                                        {!isPaid && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-red-600 text-red-600 hover:bg-red-50"
                                                onClick={openCancelModal}
                                                disabled={isCancelling}
                                            >
                                                <Ban className="w-4 h-4 mr-1.5" />
                                                Cancel
                                            </Button>
                                        )}

                                        {/* Delete */}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-red-700 text-red-700 hover:bg-red-50/40"
                                            onClick={openDeleteConfirm}
                                            disabled={isDeleting}
                                        >
                                            <Trash2 className="w-4 h-4 mr-1.5" />
                                            Delete
                                        </Button>
                                    </>
                                )}

                                {/* Approval flow - only pending */}
                                {!isPaid && !isCancelled && !isRejected && (
                                    <>
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={openApprovePaymentModal}
                                            disabled={isApproving}
                                        >
                                            {isApproving ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                    Processing...
                                                </>
                                            ) : (
                                                "Approve & Pay"
                                            )}
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-purple-600 text-purple-600 hover:bg-purple-50"
                                            onClick={openRejectModal}
                                            disabled={isRejecting}
                                        >
                                            Reject
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <Card className="shadow-xl border border-gray-200/60 bg-white">
                        <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-white rounded-t-lg py-6">
                            <div className="flex items-start justify-between gap-6">
                                <div>
                                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                                        <FileText className="w-7 h-7" />
                                        Expense Details
                                    </CardTitle>
                                    <CardDescription className="text-primary-100 text-base mt-3 flex flex-col gap-2">
                                        <div className="flex items-center gap-4">
                      <span className="font-mono font-bold text-lg tracking-wider">
                        {referenceNumber}
                      </span>
                                            <span className="text-primary-200">•</span>
                                            <span>Created by {expense.agentName}</span>
                                        </div>
                                    </CardDescription>
                                </div>
                                <div className="text-right">
                                    <Badge
                                        variant="secondary"
                                        className="bg-white/20 text-white px-4 py-2 text-sm font-medium backdrop-blur"
                                    >
                                        {expense.expenseCheck?.replace(/_/g, " ") || "STANDARD"}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Party Information */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                        Party Information
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                                <User className="w-4 h-4" />
                                                Candidate
                                            </p>
                                            <p className="text-lg font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                                                {expense.candidateName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                                <Building2 className="w-4 h-4" />
                                                Client
                                            </p>
                                            <p className="text-lg font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                                                {expense.clientName || "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                                <Building2 className="w-4 h-4" />
                                                Institution
                                            </p>
                                            <p className="text-lg font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                                                {expense.institutionName || "—"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Details + Proof Files */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                                        Payment Details
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                                <CreditCard className="w-4 h-4" />
                                                Payment Mode
                                            </p>
                                            <div className="bg-gray-50 px-3 py-2 rounded-md border">
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {getPaymentModeLabel(expense.paymentMode)}
                                                </p>
                                                {expense.paymentModeDescription && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {expense.paymentModeDescription}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                                <Calendar className="w-4 h-4" />
                                                Transaction Date
                                            </p>
                                            <p className="text-lg font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                                                {expense.date
                                                    ? format(new Date(expense.date), "EEEE, dd MMMM yyyy")
                                                    : "—"}
                                            </p>
                                        </div>
                                        {/* Reusable Proof Files Section */}
                                        <ProofFilesSection
                                            clientExpenseId={expense.id}
                                            proofFiles={proofFiles}
                                            isPaid={isPaid}
                                            isCancelled={isCancelled}
                                            isRejected={isRejected}
                                            refetchProofFiles={refetchProofFiles}
                                        />
                                    </div>
                                </div>

                                {/* Financial Summary */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-green-600" />
                                        Financial Summary
                                    </h3>
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 space-y-4 border">
                                        <div className="flex justify-between items-center text-base">
                                            <span className="text-gray-600">Base Amount</span>
                                            <span className="font-semibold text-gray-900">
                        {formatCurrency(expense.amount, expense.currency)}
                      </span>
                                        </div>
                                        {expense.paymentMode === "MPESA_PAYBILL" && (
                                            <div className="flex justify-between items-center text-base">
                                                <span className="text-gray-600">M-Pesa Fee</span>
                                                <span className="font-semibold text-orange-600">
                          +{" "}
                                                    {formatCurrency(
                                                        calculateMpesaFee(expense.amount),
                                                        expense.currency
                                                    )}
                        </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-base">
                      <span className="text-gray-600">
                        Tax{" "}
                          <span className="text-xs font-medium text-gray-500 block">
                          ({expense.paymentMode === "MPESA_PAYBILL"
                              ? "on fee only"
                              : "on amount"}{" "}
                              • 16%)
                        </span>
                      </span>
                                            <span className="font-semibold text-purple-600">
                        +{" "}
                                                {formatCurrency(
                                                    expense.paymentMode === "MPESA_PAYBILL"
                                                        ? calculateMpesaFee(expense.amount) * 0.16
                                                        : expense.amount * 0.16,
                                                    expense.currency
                                                )}
                      </span>
                                        </div>
                                        <Separator className="my-3" />
                                        <div className="flex justify-between items-center text-lg font-bold pt-2">
                                            <span className="text-gray-900">Total Amount Paid</span>
                                            <span className="text-green-700 bg-green-50 px-4 py-2 rounded-md text-xl">
                        {formatCurrency(
                            expense.totalAmountPaid || expense.amount,
                            expense.currency
                        )}
                      </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-center text-sm text-gray-500 pt-6 border-t border-gray-200">
                                <div className="flex items-center justify-center gap-4">
                  <span>
                    Expense recorded by{" "}
                      <span className="font-semibold text-gray-700">
                      {expense.agentName}
                    </span>
                  </span>
                                    <span>•</span>
                                    <span>
                    {expense.createdAt
                        ? format(new Date(expense.createdAt), "dd MMM yyyy 'at' HH:mm")
                        : format(new Date(expense.date), "dd MMM yyyy")}
                  </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modals */}
            <ConfirmDialog
                open={isCancelModalOpen}
                title="Cancel Expense"
                description="Are you sure you want to cancel this expense?"
                confirmText={isCancelling ? "Cancelling..." : "Yes, Cancel"}
                cancelText="No"
                variant="destructive"
                onConfirm={handleCancelConfirm}
                onCancel={closeCancelModal}
            />

            <ConfirmDialog
                open={isDeleteConfirmOpen}
                title="Delete Expense"
                description="This action cannot be undone. Are you absolutely sure?"
                confirmText={isDeleting ? "Deleting..." : "Yes, Delete Permanently"}
                cancelText="No"
                variant="destructive"
                onConfirm={handleDeleteConfirm}
                onCancel={closeDeleteConfirm}
            />

            <ConfirmDialog
                open={isEditConfirmOpen}
                title="Edit Expense"
                description="You are about to edit this expense. Continue?"
                confirmText="Yes, Edit"
                cancelText="Stay Here"
                variant="default"
                onConfirm={handleEditConfirm}
                onCancel={closeEditConfirm}
            />

            <ConfirmDialog
                open={isRejectModalOpen}
                title="Reject Expense"
                description="This will reject the expense and notify the agent."
                confirmText={isRejecting ? "Rejecting..." : "Yes, Reject"}
                cancelText="No"
                variant="destructive"
                onConfirm={handleRejectConfirm}
                onCancel={closeRejectModal}
            />

            <ApprovePaymentModal
                open={isApprovePaymentModalOpen}
                onOpenChange={setIsApprovePaymentModalOpen}
                totalAmount={expense.totalAmountPaid}
                currency={expense.currency}
                onSuccess={() => {
                    closeApprovePaymentModal();
                    onBack("approved");
                }}
                onApprove={handleApproveWithAccount}
            />
        </>
    );
}