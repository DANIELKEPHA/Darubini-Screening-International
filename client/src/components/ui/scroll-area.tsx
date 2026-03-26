"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
    className?: string;
    children: React.ReactNode;
}

const ScrollArea = React.forwardRef<
    React.ElementRef<typeof ScrollAreaPrimitive.Root>,
    ScrollAreaProps
>(({ className, children, ...props }, ref) => (
    <ScrollAreaPrimitive.Root
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        {...props}
    >
        <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
            {children}
        </ScrollAreaPrimitive.Viewport>
        <ScrollAreaPrimitive.Scrollbar
            orientation="vertical"
            className="flex select-none touch-none p-0.5 bg-gray-100 w-2.5 border-l border-l-transparent transition-colors duration-150 ease-out hover:bg-gray-200"
        >
            <ScrollAreaPrimitive.Thumb className="flex-1 bg-gray-400 rounded-full relative transition-colors duration-150 ease-out hover:bg-gray-500" />
        </ScrollAreaPrimitive.Scrollbar>
        <ScrollAreaPrimitive.Scrollbar
            orientation="horizontal"
            className="flex select-none touch-none p-0.5 bg-gray-100 h-2.5 border-t border-t-transparent transition-colors duration-150 ease-out hover:bg-gray-200"
        >
            <ScrollAreaPrimitive.Thumb className="flex-1 bg-gray-400 rounded-full relative transition-colors duration-150 ease-out hover:bg-gray-500" />
        </ScrollAreaPrimitive.Scrollbar>
        <ScrollAreaPrimitive.Corner className="bg-gray-400" />
    </ScrollAreaPrimitive.Root>
));

ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

export { ScrollArea };