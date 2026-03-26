"use client";

import { useRouter, useParams } from "next/navigation";
import { useGetClientExpenseQuery } from "@/state/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ClientExpenseForm from "@/app/(dashboard)/admin/client-expenses/components/ClientExpenseForm";

export default function EditExpensePage() {
    const router = useRouter();
    const { id } = useParams();
    const expenseId = Number(id);

    const { data: expense, isLoading, error } = useGetClientExpenseQuery(expenseId);

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;
    if (error || !expense) return <div className="p-8 text-center text-red-600">Expense not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-6">
            <div className="max-w-4xl mx-auto">
                <ClientExpenseForm
                    initialData={expense}
                    isEditMode={true}
                    onClose={() => router.back()}
                />
            </div>
        </div>
    );
}