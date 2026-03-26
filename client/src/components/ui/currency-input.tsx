"use client";

import React from "react";
import { Input, InputProps } from "@/components/ui/input";
import { Controller, useFormContext } from "react-hook-form";

interface CurrencyValue {
    floatValue: number;
    formattedValue: string;
    value: string;
}

interface CurrencyInputProps extends Omit<InputProps, "value" | "onChange"> {
    name?: string;
    value?: number;
    onChange?: (value: number) => void;
    onValueChange?: (value: CurrencyValue) => void;
    currency?: string;
    decimalScale?: number;
    control?: any;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
    (
        {
            name,
            value: valueProp,
            onChange: onChangeProp,
            onValueChange,
            currency = "USD",
            decimalScale = 2,
            control,
            ...props
        },
        ref
    ) => {
        const formContext = useFormContext();
        const isControlled = name && formContext;

        const formatValue = (val: number | undefined) => {
            return val !== undefined
                ? new Intl.NumberFormat("en-US", {
                    style: "decimal",
                    minimumFractionDigits: decimalScale,
                    maximumFractionDigits: decimalScale,
                }).format(val)
                : "";
        };

        const parseValue = (val: string) => {
            const parsed = parseFloat(val.replace(/[^0-9.]/g, ""));
            return isNaN(parsed) ? 0 : parseFloat(parsed.toFixed(decimalScale));
        };

        // Always declare the state — only use it if uncontrolled
        const [displayValue, setDisplayValue] = React.useState(formatValue(valueProp));

        // Uncontrolled handlers
        const handleUncontrolledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            const parsed = parseValue(value);
            setDisplayValue(value);

            onChangeProp?.(parsed);
            onValueChange?.({
                floatValue: parsed,
                formattedValue: formatValue(parsed),
                value: value,
            });
        };

        const handleUncontrolledBlur = () => {
            const parsed = parseValue(displayValue);
            const formatted = formatValue(parsed);
            setDisplayValue(formatted);

            onChangeProp?.(parsed);
            onValueChange?.({
                floatValue: parsed,
                formattedValue: formatted,
                value: formatted,
            });
        };

        if (!isControlled) {
            return (
                <Input
                    {...props}
                    ref={ref}
                    value={displayValue}
                    onChange={handleUncontrolledChange}
                    onBlur={handleUncontrolledBlur}
                    inputMode="decimal"
                    className="text-right"
                />
            );
        }

        // Controlled (react-hook-form) implementation
        return (
            <Controller
                name={name!}
                control={control || formContext.control}
                render={({ field }) => {
                    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        const parsed = parseValue(value);

                        onValueChange?.({
                            floatValue: parsed,
                            formattedValue: formatValue(parsed),
                            value: value,
                        });
                        field.onChange(parsed);
                    };

                    const handleBlur = () => {
                        const parsed = parseValue(field.value);
                        const formatted = formatValue(parsed);

                        onValueChange?.({
                            floatValue: parsed,
                            formattedValue: formatted,
                            value: formatted,
                        });
                        field.onBlur();
                        field.onChange(parsed);
                    };

                    return (
                        <Input
                            {...props}
                            ref={ref}
                            value={formatValue(field.value)}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            inputMode="decimal"
                            className="text-right"
                        />
                    );
                }}
            />
        );
    }
);

CurrencyInput.displayName = "CurrencyInput";
