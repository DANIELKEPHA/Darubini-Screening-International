"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
    React.ElementRef<typeof ProgressPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
    <ProgressPrimitive.Root
        ref={ref}
        className={cn(
            "relative h-4 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800",
            className
        )}
        {...props}
    >
        <ProgressPrimitive.Indicator
            className="h-full w-full flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
            style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
        {/* Optional: Animated shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
    </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

// Variant versions of the Progress component
const ProgressVariant = React.forwardRef<
    React.ElementRef<typeof ProgressPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    variant?: "default" | "success" | "warning" | "destructive" | "gradient";
    showLabel?: boolean;
}
>(({ className, value, variant = "default", showLabel = false, ...props }, ref) => {
    const variantClasses = {
        default: "bg-gradient-to-r from-blue-500 to-indigo-600",
        success: "bg-gradient-to-r from-green-500 to-emerald-600",
        warning: "bg-gradient-to-r from-amber-500 to-orange-600",
        destructive: "bg-gradient-to-r from-red-500 to-rose-600",
        gradient: "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500",
    };

    return (
        <div className="relative w-full">
            <ProgressPrimitive.Root
                ref={ref}
                className={cn(
                    "relative h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800",
                    variant === "gradient" && "h-4",
                    className
                )}
                {...props}
            >
                <ProgressPrimitive.Indicator
                    className={cn(
                        "h-full w-full flex-1 transition-all duration-500 ease-out",
                        variantClasses[variant]
                    )}
                    style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
                />
                {variant === "gradient" && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 animate-pulse" />
                )}
            </ProgressPrimitive.Root>

            {showLabel && (
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span className="font-medium">{value}%</span>
                    <span>100%</span>
                </div>
            )}
        </div>
    );
});
ProgressVariant.displayName = "ProgressVariant";

// Size variations
const ProgressSizes = {
    sm: "h-2",
    default: "h-3",
    lg: "h-4",
    xl: "h-6",
};

type ProgressSizeProps = React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    size?: keyof typeof ProgressSizes;
};

const ProgressWithSize = React.forwardRef<
    React.ElementRef<typeof ProgressPrimitive.Root>,
    ProgressSizeProps
>(({ className, size = "default", value, ...props }, ref) => (
    <ProgressPrimitive.Root
        ref={ref}
        className={cn(
            "relative w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800",
            ProgressSizes[size],
            className
        )}
        {...props}
    >
        <ProgressPrimitive.Indicator
            className="h-full w-full flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
            style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
    </ProgressPrimitive.Root>
));
ProgressWithSize.displayName = "ProgressWithSize";

// Progress with steps
interface ProgressStepsProps {
    steps: number;
    currentStep: number;
    className?: string;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ steps, currentStep, className }) => {
    return (
        <div className={cn("flex items-center justify-between", className)}>
            {Array.from({ length: steps }).map((_, index) => (
                <React.Fragment key={index}>
                    <div className="flex flex-col items-center">
                        <div
                            className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300",
                                index < currentStep
                                    ? "bg-green-500 border-green-500 text-white"
                                    : index === currentStep
                                        ? "bg-blue-500 border-blue-500 text-white"
                                        : "bg-gray-100 border-gray-300 text-gray-400"
                            )}
                        >
                            {index + 1}
                        </div>
                        <span
                            className={cn(
                                "text-xs mt-1 transition-colors",
                                index <= currentStep ? "text-gray-900 font-medium" : "text-gray-500"
                            )}
                        >
              Step {index + 1}
            </span>
                    </div>
                    {index < steps - 1 && (
                        <div
                            className={cn(
                                "flex-1 h-1 mx-2 transition-colors",
                                index < currentStep ? "bg-green-500" : "bg-gray-200"
                            )}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

// Export all variants
export {
    Progress,
    ProgressVariant,
    ProgressWithSize,
    ProgressSteps
};

// Export the primitive for custom implementations
export { ProgressPrimitive };