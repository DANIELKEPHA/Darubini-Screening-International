"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertCircle, Wallet, Loader2 } from "lucide-react";
import { useGetCashAccountsQuery } from "@/state/api";
import { toast } from "sonner";

interface ApprovePaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    totalAmount: number;
    currency: string;
    onApprove: (cashAccountId: number) => Promise<void>;
    onSuccess: () => void;
}

export default function ApprovePaymentModal({
                                                open,
                                                onOpenChange,
                                                totalAmount,
                                                currency,
                                                onApprove,
                                                onSuccess,
                                            }: ApprovePaymentModalProps) {
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");

    const {
        data: cashAccountsData,
        isLoading,
        isError,
    } = useGetCashAccountsQuery({ limit: 200 }); // enterprise: fetch more

    const cashAccounts = cashAccountsData?.accounts || [];
    const amountDecimal = Number(totalAmount);

    const selectedAccount = cashAccounts.find(
        (acc) => acc.id.toString() === selectedAccountId
    );

    const hasSufficientFunds =
        selectedAccount && Number(selectedAccount.balance) >= amountDecimal;

    const handleApprove = async () => {
        if (!selectedAccountId) {
            toast.error("Please select a cash account");
            return;
        }
        if (!hasSufficientFunds) {
            toast.error("Insufficient balance in selected account");
            return;
        }

        try {
            await onApprove(Number(selectedAccountId));
            toast.success("Expense approved and paid successfully!");
            onSuccess();
            onOpenChange(false);
            setSelectedAccountId("");
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to approve expense");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Wallet className="w-6 h-6" />
                        Approve & Pay Expense
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        Select any cash account to deduct{" "}
                        <span className="font-bold text-primary">
              {currency} {amountDecimal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 max-h-96 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <Loader2 className="w-10 h-10 animate-spin mb-4" />
                            <p>Loading cash accounts...</p>
                        </div>
                    ) : isError ? (
                        <div className="text-center py-12 text-destructive">
                            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                            <p>Failed to load cash accounts</p>
                        </div>
                    ) : cashAccounts.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No cash accounts available</p>
                            <p className="text-sm mt-2">Please create a cash account first.</p>
                        </div>
                    ) : (
                        <RadioGroup value={selectedAccountId} onValueChange={setSelectedAccountId}>
                            {cashAccounts.map((account) => {
                                const balance = Number(account.balance);
                                const sufficient = balance >= amountDecimal;

                                return (
                                    <div
                                        key={account.id}
                                        className={`mb-4 rounded-lg border-2 p-5 transition-all cursor-pointer ${
                                            selectedAccountId === account.id.toString()
                                                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                                : "border-border hover:border-primary/60"
                                        }`}
                                    >
                                        <div className="flex items-center space-x-4">
                                            <RadioGroupItem value={account.id.toString()} id={`acc-${account.id}`} />
                                            <Label
                                                htmlFor={`acc-${account.id}`}
                                                className="flex-1 cursor-pointer space-y-3"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-lg font-semibold text-foreground">
                                                            {account.accountName}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {account.accountNumber}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-foreground">
                                                            {account.currency} {balance.toLocaleString()}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Available balance
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 text-sm">
                                                    {!sufficient && (
                                                        <span className="flex items-center text-destructive font-medium">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              Insufficient funds
                            </span>
                                                    )}
                                                    {sufficient && balance < amountDecimal * 2 && (
                                                        <span className="text-orange-600 font-medium">
                              Low balance after payment
                            </span>
                                                    )}
                                                </div>
                                            </Label>
                                        </div>
                                    </div>
                                );
                            })}
                        </RadioGroup>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApprove}
                        disabled={!selectedAccountId || !hasSufficientFunds || isLoading}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                        Approve & Pay
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}