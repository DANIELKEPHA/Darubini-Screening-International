import { format } from "date-fns";

export const formatCurrencyAmount = (
    amount: number | undefined | null,
    currency: string | undefined | null
): string => {
    if (amount === undefined || amount === null) return "N/A";
    return `${currency || "N/A"} ${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

export const formatFrequency = (frequency: string): string => {
    return frequency
        ? frequency.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
        : "N/A";
};

export const formatPaymentMode = (paymentMode: string): string => {
    return paymentMode
        ? paymentMode.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
        : "N/A";
};

export const formatDate = (date: string | Date | undefined | null): string => {
    if (!date) return "N/A";
    return format(new Date(date), "PP");
};

export const formatCurrency = (
    amount: number | string,
    currency: string = 'KES',
    options: Intl.NumberFormatOptions = {}
): string => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numericAmount)) {
        return '0.00';
    }

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options,
    });

    return formatter.format(numericAmount);
};