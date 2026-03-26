import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { format } from 'date-fns';
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import {AccountType, ApiErrorResponse, Frequency, ItemType, PaymentMode, Transaction} from "@/state";
import * as Yup from "yup";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatEnumString(enumValue: string | null | undefined): string {
    if (!enumValue) return '';
    return enumValue
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
    return typeof error === 'object' && error != null && 'status' in error;
}

export function isSerializedError(error: unknown): error is { message: string } {
    return typeof error === 'object' && error != null && 'message' in error;
}

export const withRetry = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            if (error.status === 429 && attempt < maxRetries) {
                const delay = baseDelay * 2 ** (attempt - 1);
                await new Promise((resolve) => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
    throw new Error('Max retries reached');
};

export const clientExpenseSchema = Yup.object().shape({
    agentName: Yup.string().required("Agent name is required"),
    date: Yup.string().required("Date is required"),
    expenseDetails: Yup.string().required("Expense details are required"),
    expenseName: Yup.string().required("Expense name is required"),
    institutionName: Yup.string().required("Institution name is required"),
    reasonForPayment: Yup.string().required("Reason for payment is required"),
    amount: Yup.string()
        .required("Amount is required")
        .matches(/^\d+(\.\d{1,2})?$/, "Amount must be a valid number with up to 2 decimal places"),
    currency: Yup.string().required("Currency is required"),
    totalAmount: Yup.string()
        .required("Total amount is required")
        .matches(/^\d+(\.\d{1,2})?$/, "Total amount must be a valid number with up to 2 decimal places"),
    totalAmountPaid: Yup.string()
        .required("Total amount paid is required")
        .matches(/^\d+(\.\d{1,2})?$/, "Total amount paid must be a valid number with up to 2 decimal places"),
    frequency: Yup.string()
        .oneOf(Object.values(Frequency), "Invalid frequency")
        .required("Frequency is required"),
    paymentMode: Yup.string()
        .oneOf(Object.values(PaymentMode), "Invalid payment mode")
        .required("Payment mode is required"),
    itemType: Yup.string()
        .oneOf(Object.values(ItemType), "Invalid item type")
        .required("Item type is required"),
    accountType: Yup.string()
        .oneOf(Object.values(AccountType), "Invalid account type")
        .required("Account type is required"),
    kraPin: Yup.string().optional(),
    referenceNumber: Yup.string().optional(),
    paymentModeDescription: Yup.string().optional(),
    lpoStatus: Yup.string().optional(),
    supplierId: Yup.number().optional(),
    proofFile: Yup.mixed<File>()
        .optional()
        .test("is-file", "Must be a valid file", (value) => {
            if (!value) return true; // Allow undefined
            return value instanceof File;
        }),
});

export function cleanParams(params: Record<string, string | undefined>): Record<string, string> {
    return Object.fromEntries(
        Object.entries(params).filter(
            ([_, value]) =>
                value !== undefined &&
                value !== "any" &&
                value !== "" &&
                value !== null
        ) as [string, string][]
    );
}

export const formatCurrency = (amount: string | number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'Ksh',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(amount));
};

export function getBalanceStatus(balance: string | number | undefined): string {
    const bal = typeof balance === 'string' ? Number(balance) : (balance || 0);
    if (isNaN(bal) || bal < 1000) return 'CRITICAL';
    if (bal < 5000) return 'LOW';
    return 'ACTIVE';
}

export function formatDate(dateString: string): string {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

export const formatDateTime = (date: string | Date): string => {
    return format(new Date(date), 'yyyy-MM-dd h:mm a');
};

export function calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
}

export function toTitleCase(str: string): string {
    return str
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export const withToast = async <T>(
    mutationFn: Promise<T>,
    messages: Partial<{
        pending?: string;
        success?: string;
        error: string | ((error: unknown) => string);
    }>
) => {
    const { pending, success, error } = messages;

    if (pending) toast.loading(pending);

    try {
        const result = await mutationFn;
        if (pending) toast.dismiss();
        if (success) toast.success(success);
        return result;
    } catch (err: any) {
        if (pending) toast.dismiss();

        const isBaseQueryError = isFetchBaseQueryError(err);

        const errorData =
            isBaseQueryError && typeof err.data === 'object' && err.data !== null
                ? (err.data as { message?: string })
                : undefined;

        const errorDetails = {
            status: isBaseQueryError ? err.status : undefined,
            data: isBaseQueryError ? err.data : undefined,
            message:
                errorData?.message ||
                (err.message as string | undefined) ||
                'Unknown error',
            timestamp: new Date().toISOString(),
        };

        console.error("withToast error:", errorDetails);

        if (error) {
            const errorMessage = typeof error === 'string' ? error : error(err);
            toast.error(`${errorMessage}: ${errorDetails.message}`);
        }

        throw err;
    }
};


export const createNewUserInDatabase = async (
    user: any,
    idToken: any,
    userRole: string,
    fetchWithBQ: any
) => {
    let createEndpoint: string;
    switch (userRole?.toLowerCase()) {
        case "admin":
            createEndpoint = "/admin";
            break;
        case "user":
            createEndpoint = "/users";
            break;
        case "accounts":
            createEndpoint = "/accounts";
            break;
        case "staff":
            createEndpoint = "/staff";
            break;
        default:
            throw new Error(`Unsupported user role: ${userRole}`);
    }

    const email = idToken?.payload?.email;
    const phoneNumber = idToken?.payload?.phone_number;

    if (!email) {
        throw new Error("Email is required but was not found in idToken");
    }

    const createUserResponse = await fetchWithBQ({
        url: createEndpoint,
        method: "POST",
        body: {
            cognitoId: user.userId,
            name: idToken?.payload?.name || user.username,
            email,
            phoneNumber: phoneNumber || null,
        },
    });

    if (createUserResponse.error) {
        throw new Error(
            createUserResponse.error.data?.message || "Failed to create user record"
        );
    }

    return createUserResponse;
};

export const getErrorMessage = (error: unknown): string => {
    if (!error || typeof error !== "object") return "An unknown error occurred";

    if ("message" in error && typeof (error as any).message === "string") {
        return (error as any).message;
    }

    if ("status" in error) {
        const fetchError = error as FetchBaseQueryError & { data?: ApiErrorResponse | string };
        if (typeof fetchError.data === 'string') {
            return fetchError.data;
        }
        if (fetchError.data?.message) {
            return fetchError.data.message;
        }
        return `Error ${fetchError.status}: ${JSON.stringify(fetchError.data) || "Unknown error"}`;
    }

    return "An unknown error occurred";
};
