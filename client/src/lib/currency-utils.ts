export const formatCurrency = (
    value: number,
    currency: string,
    decimalScale: number
): string => {
    if (currency === "USD") {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: decimalScale,
            maximumFractionDigits: decimalScale,
        }).format(value);
    }

    if (currency === "KES") {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            minimumFractionDigits: decimalScale,
            maximumFractionDigits: decimalScale,
        }).format(value);
    }

    // Fallback for other currencies
    return new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: decimalScale,
        maximumFractionDigits: decimalScale,
    }).format(value);
};

export const parseCurrency = (value: string, decimalScale: number): number => {
    // Remove all non-digit characters except periods
    const numericString = value.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(numericString);

    // Return 0 if NaN, otherwise round to specified decimal places
    return isNaN(parsed) ? 0 : parseFloat(parsed.toFixed(decimalScale));
};

export const getCurrencySymbol = (currency: string): string => {
    try {
        return (0)
            .toLocaleString("en-US", {
                style: "currency",
                currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            })
            .replace(/\d/g, "")
            .trim();
    } catch {
        return currency;
    }
};