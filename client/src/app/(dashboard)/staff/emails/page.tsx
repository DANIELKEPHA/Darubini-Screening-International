"use client";

import React, { useState } from "react";
import { useGetEmailListsQuery, useGetCampaignsQuery } from "@/state/api";
import { EmailList, EmailCampaign } from "@/types/prismaTypes";
import EmailLists from "@/app/(dashboard)/admin/emails/EmailLists";
import CreateCampaignForm from "@/app/(dashboard)/admin/emails/CreateCampaignForm";
import CampaignAnalytics from "@/app/(dashboard)/admin/emails/CampaignAnalytics";
import AddEmailToListForm from "@/app/(dashboard)/admin/emails/AddEmailToListForm";
import { CampaignsTable } from "@/app/(dashboard)/admin/emails/components/CampaignsTable";
import { CampaignDetailsModal } from "@/app/(dashboard)/admin/emails/components/CampaignDetailsModal";
import { Button } from "@/components/ui/button";
import { Plus, List, BarChart2, Send } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import CreateListForm from "@/app/(dashboard)/admin/emails/CreateListForm";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmailsPage() {
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [showCreateList, setShowCreateList] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const router = useRouter();

  // Fetch email lists and campaigns
  const { data: emailLists, isLoading: listsLoading, error: listsError } = useGetEmailListsQuery({
    page: 1,
    limit: 100,
  });
  const { data: campaignsData, isLoading: campaignsLoading } = useGetCampaignsQuery({
    page: 1,
    limit: 100,
  });

  // Extract campaigns array from paginated response
  const campaigns = campaignsData?.data ?? [];

  const handleSelectList = (id: number) => {
    setSelectedListId(id);
  };

  const handleSendTest = async (campaignId: number) => {
    try {
      toast.success("Test email sent successfully");
    } catch (error) {
      toast.error("Failed to send test email");
    }
  };

  const handleSchedule = async (campaignId: number) => {
    try {
      toast.success("Campaign scheduled successfully");
    } catch (error) {
      toast.error("Failed to schedule campaign");
    }
  };

  const handleEditCampaign = (campaign: EmailCampaign) => {
    setSelectedCampaign(campaign);
    setShowCreateCampaign(true);
  };

  const handleDuplicateCampaign = (campaign: EmailCampaign) => {
    setSelectedCampaign({
      ...campaign,
      id: 0,
      name: `${campaign.name} (Copy)`,
      status: "DRAFT",
      sentAt: null,
    });
    setShowCreateCampaign(true);
  };

  if (listsError) {
    const errorMessage = 'status' in listsError
        ? (listsError.data as { message?: string })?.message || 'Unknown error occurred'
        : listsError.message || 'Unknown error occurred';
    return (
        <Card className="p-6">
          <CardContent>
            <p className="text-center text-red-500">Error loading email data: {errorMessage}</p>
          </CardContent>
        </Card>
    );
  }

  return (
      <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-800">Email Marketing Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="lists" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-lg p-1">
                <TabsTrigger
                    value="lists"
                    className="flex items-center gap-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <List className="h-4 w-4" />
                  Lists
                </TabsTrigger>
                <TabsTrigger
                    value="campaigns"
                    className="flex items-center gap-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Send className="h-4 w-4" />
                  Campaigns
                </TabsTrigger>
                <TabsTrigger
                    value="analytics"
                    className="flex items-center gap-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <BarChart2 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="lists" className="mt-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Email Lists</h2>
                  <Button
                      onClick={() => setShowCreateList(!showCreateList)}
                      variant="outline"
                      className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {showCreateList ? "Cancel" : "New List"}
                  </Button>
                </div>
                {showCreateList && <CreateListForm />}
                <EmailLists
                    emailLists={emailLists}
                    isLoading={listsLoading}
                    selectedListId={selectedListId}
                    onSelectList={handleSelectList}
                />
                <AddEmailToListForm emailLists={emailLists || []} isLoading={listsLoading} />
              </TabsContent>

              <TabsContent value="campaigns" className="mt-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Campaigns</h2>
                  <Button
                      onClick={() => setShowCreateCampaign(!showCreateCampaign)}
                      className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {showCreateCampaign ? "Cancel" : "New Campaign"}
                  </Button>
                </div>
                {showCreateCampaign && (
                    <CreateCampaignForm
                        emailLists={emailLists}
                        isLoading={listsLoading}
                        onCancel={() => {
                          setShowCreateCampaign(false);
                          setSelectedCampaign(null);
                        }}
                    />
                )}
                {!showCreateCampaign && (
                    <CampaignsTable
                        campaigns={campaigns}
                        isLoading={campaignsLoading}
                        onViewDetails={setSelectedCampaign}
                        onEdit={handleEditCampaign}
                        onDuplicate={handleDuplicateCampaign}
                    />
                )}
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                {selectedListId && <CampaignAnalytics listId={selectedListId} />}
              </TabsContent>
            </Tabs>

            {selectedCampaign && (
                <CampaignDetailsModal
                    campaign={selectedCampaign}
                    isOpen={!!selectedCampaign}
                    onClose={() => setSelectedCampaign(null)}
                    onSendTest={() => handleSendTest(selectedCampaign.id)}
                    onSchedule={() => handleSchedule(selectedCampaign.id)}
                    onContentUpdate={(updatedContent) => {
                      console.log("Updated HTML content:", updatedContent);
                    }}
                />
            )}
          </CardContent>
        </Card>
      </div>
  );
}