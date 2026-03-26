"use client";

import * as React from "react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import { cn } from "@/lib/utils";

const Calendar = ({ className, classNames, ...props }: DayPickerProps) => {
    return (
        <DayPicker
            showOutsideDays
            className={cn("p-3", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button:
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell:
                    "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent",
                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                day_today: "bg-muted text-muted-foreground",
                day_outside: "text-muted opacity-50",
                day_disabled: "text-muted opacity-50",
                day_range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_range_start:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_range_end:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                ...classNames,
            }}
            components={{

            }}
            {...props}
        />
    );
};

export { Calendar };
