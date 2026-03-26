import React from "react";
import { cn } from "@/lib/utils";

type Status = "online" | "offline" | "busy" | "away" | "idle";

interface StatusBadgeProps {
    status: Status;
}

const statusStyles: Record<Status, { color: string; label: string }> = {
    online: { color: "bg-green-500", label: "Online" },
    offline: { color: "bg-gray-400", label: "Offline" },
    busy: { color: "bg-red-500", label: "Busy" },
    away: { color: "bg-yellow-400", label: "Away" },
    idle: { color: "bg-orange-400", label: "Idle" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
    const style = statusStyles[status] || statusStyles["offline"];

    return (
        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground shadow-sm border border-border">
      <span className={cn("h-2 w-2 rounded-full", style.color)} />
      <span>{style.label}</span>
    </span>
    );
}
