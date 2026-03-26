"use client";

import React from "react";
import { motion } from "framer-motion";
import { BarChart2 } from "lucide-react";
import { useGetCampaignAnalyticsQuery } from "@/state/api";

interface CampaignAnalyticsProps {
    listId: number;
}

const CampaignAnalytics: React.FC<CampaignAnalyticsProps> = ({ listId }) => {
    const { data: analytics, isLoading } = useGetCampaignAnalyticsQuery(
        { id: listId, range: "all" },
        { skip: !listId }
    );

    return (
        <motion.div
            className="p-6 bg-white rounded-xl shadow-md border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
        >
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary-500" />
                Campaign Analytics
            </h2>

            {isLoading ? (
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                </div>
            ) : analytics ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatCard
                        label="Total Sends"
                        value={analytics.totalSends}
                        color="bg-blue-100 text-blue-800"
                    />
                    <StatCard
                        label="Delivered"
                        value={analytics.delivered}
                        color="bg-green-100 text-green-800"
                    />
                    <StatCard
                        label="Open Rate"
                        value={`${analytics.openRate.toFixed(2)}%`}
                        color="bg-purple-100 text-purple-800"
                    />
                    <StatCard
                        label="Click Rate"
                        value={`${analytics.clickRate.toFixed(2)}%`}
                        color="bg-yellow-100 text-yellow-800"
                    />
                    <StatCard
                        label="Bounce Rate"
                        value={`${analytics.bounceRate.toFixed(2)}%`}
                        color="bg-red-100 text-red-800"
                    />
                </div>
            ) : (
                <p className="text-gray-500 text-center py-4">No analytics available</p>
            )}
        </motion.div>
    );
};

const StatCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
    <motion.div
        className={`p-4 rounded-lg ${color} shadow-sm`}
        whileHover={{ y: -5 }}
    >
        <h3 className="text-sm font-medium mb-1">{label}</h3>
        <p className="text-2xl font-bold">{value}</p>
    </motion.div>
);

export default CampaignAnalytics;