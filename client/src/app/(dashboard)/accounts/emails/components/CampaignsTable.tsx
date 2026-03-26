"use client";

import { useState } from "react";
import { Mail, Clock, Eye, Edit, Copy } from "lucide-react";
import { useScheduleCampaignMutation } from "@/state/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmailCampaign } from "@/types/prismaTypes";

interface CampaignsTableProps {
    campaigns?: EmailCampaign[];
    isLoading: boolean;
    onViewDetails: (campaign: EmailCampaign) => void;
    onEdit?: (campaign: EmailCampaign) => void;
    onDuplicate?: (campaign: EmailCampaign) => void;
}

export function CampaignsTable({
                                   campaigns,
                                   isLoading,
                                   onViewDetails,
                                   onEdit,
                                   onDuplicate,
                               }: CampaignsTableProps) {
    const [scheduleCampaign] = useScheduleCampaignMutation();
    const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);

    const handleSchedule = async (campaignId: number) => {
        // For now, use a placeholder future date (e.g., tomorrow).
        // In a real app, this should come from a date picker or user input.
        const scheduleAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        try {
            await scheduleCampaign({ campaignId, scheduleAt }).unwrap();
            toast.success("Campaign scheduled successfully");
        } catch (error) {
            toast.error("Failed to schedule campaign");
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!campaigns || campaigns.length === 0) {
        return (
            <div className="text-center py-12">
                <Mail className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a new campaign.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        List
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Sent
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Open Rate
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                    </th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            <button
                                onClick={() => onViewDetails(campaign)}
                                className="text-blue-600 hover:text-blue-900 hover:underline"
                            >
                                {campaign.name}
                            </button>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {campaign.emailList?.name || "No list"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <StatusBadge status={campaign.status} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString() : "Not sent"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="flex items-center">
                                <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full"
                                        style={{ width: `${campaign.openRate || 0}%` }}
                                    />
                                </div>
                                {campaign.openRate?.toFixed(1) || 0}%
                            </div>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => onViewDetails(campaign)}
                                        className="cursor-pointer"
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                    </DropdownMenuItem>
                                    {campaign.status !== "SENT" && (
                                        <DropdownMenuItem
                                            onClick={() => handleSchedule(campaign.id)}
                                            className="cursor-pointer"
                                        >
                                            <Clock className="mr-2 h-4 w-4" />
                                            Schedule
                                        </DropdownMenuItem>
                                    )}
                                    {onEdit && (
                                        <DropdownMenuItem
                                            onClick={() => onEdit(campaign)}
                                            className="cursor-pointer"
                                        >
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </DropdownMenuItem>
                                    )}
                                    {onDuplicate && (
                                        <DropdownMenuItem
                                            onClick={() => onDuplicate(campaign)}
                                            className="cursor-pointer"
                                        >
                                            <Copy className="mr-2 h-4 w-4" />
                                            Duplicate
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}