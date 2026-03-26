"use client";

import { useState } from "react";
import { useGetCampaignsQuery } from "@/state/api";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Clock } from "lucide-react";
import CreateCampaignForm from "@/app/(dashboard)/accounts/emails/CreateCampaignForm";
import { CampaignDetailsModal } from "@/app/(dashboard)/accounts/emails/components/CampaignDetailsModal";
import { EmailCampaign } from "@/types/prismaTypes";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {CampaignsTable} from "@/app/(dashboard)/accounts/emails/components/CampaignsTable";

export default function CampaignsPage() {
    const { data: campaigns, isLoading } = useGetCampaignsQuery({});
    const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [activeTab, setActiveTab] = useState("all");

    const handleSendTest = (campaignId: number) => {
        console.log("Sending test for campaign:", campaignId);
        // Implement actual test send logic
    };

    const handleSchedule = (campaignId: number) => {
        console.log("Scheduling campaign:", campaignId);
        // Implement actual schedule logic
    };

    const handleContentUpdate = (newContent: string) => {
        console.log("Content updated:", newContent);
        // Implement content update logic if needed
    };

    const filteredCampaigns = campaigns?.data?.filter(campaign => {
        if (activeTab === "all") return true;
        if (activeTab === "drafts") return campaign.status === "DRAFT";
        if (activeTab === "scheduled") return campaign.status === "SCHEDULED";
        if (activeTab === "sent") return campaign.status === "SENT";
        return true;
    }) || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Email Campaigns</h2>
                <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Campaign
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="drafts">Drafts</TabsTrigger>
                    <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                    <TabsTrigger value="sent">Sent</TabsTrigger>
                </TabsList>
            </Tabs>

            {showCreateForm ? (
                <CreateCampaignForm
                    onCancel={() => setShowCreateForm(false)}
                    onSuccess={() => setShowCreateForm(false)}
                />
            ) : (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>
                                {activeTab === "all" && "All Campaigns"}
                                {activeTab === "drafts" && "Draft Campaigns"}
                                {activeTab === "scheduled" && "Scheduled Campaigns"}
                                {activeTab === "sent" && "Sent Campaigns"}
                            </CardTitle>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                    <Mail className="mr-2 h-4 w-4" />
                                    Export
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Clock className="mr-2 h-4 w-4" />
                                    Filter
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CampaignsTable
                            campaigns={filteredCampaigns}
                            isLoading={isLoading}
                            onViewDetails={setSelectedCampaign}
                        />
                    </CardContent>
                </Card>
            )}

            {selectedCampaign && (
                <CampaignDetailsModal
                    campaign={selectedCampaign}
                    isOpen={!!selectedCampaign}
                    onClose={() => setSelectedCampaign(null)}
                    onSendTest={() => handleSendTest(selectedCampaign.id)}
                    onSchedule={() => handleSchedule(selectedCampaign.id)}
                    onContentUpdate={handleContentUpdate}
                />
            )}
        </div>
    );
}