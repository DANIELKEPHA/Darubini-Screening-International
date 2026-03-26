"use client";

import { useGetCampaignAnalyticsQuery } from "@/state/api";
import { useState } from "react";
import {AnalyticsDashboard} from "@/app/(dashboard)/accounts/emails/components/AnalyticsDashboard";
import {useSearchParams} from "next/navigation";

export default function AnalyticsPage() {
    const searchParams = useSearchParams();
    const campaignId = searchParams.get("campaignId");

    const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

    const { data: analytics, isLoading } = useGetCampaignAnalyticsQuery({
        id: Number(campaignId), // 👈 Convert to number
        range: timeRange,
    });

    if (!campaignId) return <p>Please select a campaign.</p>;


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Email Analytics</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setTimeRange("7d")}
                        className={`px-3 py-1 text-sm rounded-md ${
                            timeRange === "7d" ? "bg-blue-100 text-blue-800" : "bg-gray-100"
                        }`}
                    >
                        7 Days
                    </button>
                    <button
                        onClick={() => setTimeRange("30d")}
                        className={`px-3 py-1 text-sm rounded-md ${
                            timeRange === "30d" ? "bg-blue-100 text-blue-800" : "bg-gray-100"
                        }`}
                    >
                        30 Days
                    </button>
                    <button
                        onClick={() => setTimeRange("90d")}
                        className={`px-3 py-1 text-sm rounded-md ${
                            timeRange === "90d" ? "bg-blue-100 text-blue-800" : "bg-gray-100"
                        }`}
                    >
                        90 Days
                    </button>
                </div>
            </div>

            <AnalyticsDashboard
                data={analytics}
                isLoading={isLoading}
                timeRange={timeRange}
            />
        </div>
    );
}