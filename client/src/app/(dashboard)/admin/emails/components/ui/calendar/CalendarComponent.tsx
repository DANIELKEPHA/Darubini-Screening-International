// components/ui/calendar/CalendarComponent.tsx
"use client";

import * as React from "react";
import { addDays, format, isSameDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface CalendarComponentProps {
    className?: string;
    dateRange: DateRange | undefined;
    onDateRangeChange: (range: DateRange | undefined) => void;
    numberOfMonths?: number;
    disabled?: boolean;
}

export function CalendarComponent({
                                      className,
                                      dateRange,
                                      onDateRangeChange,
                                      numberOfMonths = 2,
                                      disabled = false,
                                  }: CalendarComponentProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const handleSelect = (range: DateRange | undefined) => {
        if (range?.from && range?.to && isSameDay(range.from, range.to)) {
            onDateRangeChange({ from: range.from, to: addDays(range.from, 1) });
            setIsOpen(false);
        } else {
            onDateRangeChange(range);
            if (range?.from && range?.to) {
                setIsOpen(false);
            }
        }
    };

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        disabled={disabled}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                    {format(dateRange.from, "MMM dd, yyyy")} -{" "}
                                    {format(dateRange.to, "MMM dd, yyyy")}
                                </>
                            ) : (
                                format(dateRange.from, "MMM dd, yyyy")
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={handleSelect}
                        numberOfMonths={numberOfMonths}
                        disabled={(date) => date > new Date()}
                        className="border-0"
                    />
                    {dateRange?.from && !dateRange?.to && (
                        <div className="p-3 text-center text-sm text-muted-foreground">
                            {format(dateRange.from, "PPP")}
                        </div>
                    )}
                </PopoverContent>
            </Popover>
        </div>
    );
}