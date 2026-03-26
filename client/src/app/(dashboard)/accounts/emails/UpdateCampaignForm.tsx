"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { EmailList, EmailCampaign, Attachment } from "@/types/prismaTypes";
import { useUpdateEmailCampaignMutation, useGetCampaignsQuery } from "@/state/api";
import { getErrorMessage } from "@/lib/utils";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/components/ui/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SerializedError } from "@reduxjs/toolkit";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";


const EmailEditor = dynamic(
    () => import("@/app/(dashboard)/accounts/emails/EmailEditor"),
    {
        ssr: false,
        loading: () => (
            <div className="p-4 bg-muted/50 rounded-lg animate-pulse h-[500px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Icons.spinner className="h-6 w-6 animate-spin" />
                    <span>Loading editor...</span>
                </div>
            </div>
        ),
    }
);

interface UpdateCampaignFormProps {
    campaignId: number;
    emailLists?: EmailList[];
    isLoading?: boolean;
    error?: Error | FetchBaseQueryError | SerializedError | null;
    onCancel: () => void;
    onSuccess?: () => void;
}

const defaultFooter = `
  <hr style="border-top: 1px solid #e0e0e0; margin: 20px 0;" />
  <div style="text-align: center; font-family: Arial, sans-serif; font-size: 12px; color: #555555; line-height: 1.6; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 10px; border-radius: 4px;" contenteditable="false">
    <p style="margin-bottom: 16px;">
      <img src="/logo.png" alt="darubibi-logo" style="width: 100px; height: auto;" />
    </p>
    <p style="font-weight: 600; color: #333333; margin-bottom: 8px;">
      Facilitating Safe Recruitment Decisions
    </p>
    <div style="margin: 16px 0; text-align: center; line-height: 1;">
      <a href="https://linkedin.com/company/darubini-screening" style="margin: 0 8px; display: inline-block;">
        <img src="/linkedin-icon.png" alt="LinkedIn" style="width: 24px; height: 24px; vertical-align: middle;" />
      </a>
      <a href="https://wa.me/254721369925" style="margin: 0 8px; display: inline-block;">
        <img src="/whatsapp-icon.png" alt="WhatsApp" style="width: 24px; height: 24px; vertical-align: middle;" />
      </a>
      <a href="https://instagram.com/darubiniscreening" style="margin: 0 8px; display: inline-block;">
        <img src="/instagram-icon.png" alt="Instagram" style="width: 24px; height: 24px; vertical-align: middle;" />
      </a>
      <a href="https://facebook.com/darubiniscreening" style="margin: 0 8px; display: inline-block;">
        <img src="/facebook-icon.png" alt="Facebook" style="width: 24px; height: 24px; vertical-align: middle;" />
      </a>
      <a href="https://tiktok.com/@darubiniscreening" style="margin: 0 8px; display: inline-block;">
        <img src="/tiktok-icon.png" alt="TikTok" style="width: 24px; height: 24px; vertical-align: middle;" />
      </a>
    </div>
    <div style="margin: 12px 0; font-size: 11px;">
      <p style="margin: 4px 0;">
        <strong>Phone:</strong> 
        <a href="tel:+254738743008" style="color: #555555; text-decoration: none;">+254 738 743008</a> | 
        <a href="tel:+254772743008" style="color: #555555; text-decoration: none;">+254 772 743008</a> |
        <a href="tel:+254746730594" style="color: #555555; text-decoration: none;">+254 746 730594</a>
      </p>
      <p style="margin: 4px 0;">
        <strong>WhatsApp:</strong> 
        <a href="https://wa.me/254780683290" style="color: #555555; text-decoration: none;">+254 780 683290</a> | 
        <a href="https://wa.me/254721369925" style="color: #555555; text-decoration: none;">+254 721 369925</a>
      </p>
    </div>
    <div style="margin: 12px 0; font-size: 11px; color: #777777;">
      <p style="margin: 4px 0;">TRV Office Plaza, 58 Muthithi Road, Westlands</p>
      <p style="margin: 4px 0;">P.O. Box 6079, 00100 Nairobi, Kenya</p>
    </div>
    <div style="margin: 12px 0; font-size: 11px; color: #777777;">
      <p style="margin: 4px 0;">www.darubiniscreening.com</p>
    </div>
    <p style="margin-top: 16px; font-size: 10px; color: #999999;">
      &copy; ${new Date().getFullYear()} Darubini Screening International. All rights reserved.
    </p>
  </div>
`;

const UpdateCampaignForm: React.FC<UpdateCampaignFormProps> = ({
                                                                   campaignId,
                                                                   emailLists = [],
                                                                   isLoading: isExternalLoading = false,
                                                                   error: externalError = null,
                                                                   onCancel,
                                                                   onSuccess,
                                                               }) => {
    const { data: campaignsData, isLoading: isFetching, error: fetchError } = useGetCampaignsQuery({ page: 1, limit: 10 });
    const campaign = campaignsData?.data.find((c) => c.id === campaignId);
    const [newCampaign, setNewCampaign] = useState({
        name: "",
        subject: "",
        emailListId: "",
        scheduledAt: "",
        attachments: [] as File[],
    });
    const [htmlContent, setHtmlContent] = useState("");
    const [updateEmailCampaign, { isLoading: isUpdating }] = useUpdateEmailCampaignMutation();

    const memoizedEmailLists = useMemo(() => emailLists, [emailLists]);

    useEffect(() => {
        if (campaign) {
            setNewCampaign({
                name: campaign.name,
                subject: campaign.subject,
                emailListId: campaign.emailListId.toString(),
                scheduledAt: campaign.scheduledAt || "",
                attachments: [],
            });
            setHtmlContent(campaign.htmlContent || `<h1>Your Email Heading</h1><p>Type your email content here...</p>${defaultFooter}`);
        }
    }, [campaign]);

    const handleInputChange = useCallback(
        (field: keyof typeof newCampaign, value: string | File[]) => {
            setNewCampaign((prev) => ({ ...prev, [field]: value }));
        },
        []
    );

    const handleHtmlContentChange = useCallback(
        (content: string) => {
            if (content !== htmlContent) {
                setHtmlContent(content);
            }
        },
        [htmlContent]
    );

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files) {
                const validFiles = Array.from(files).filter((file) => {
                    const allowedTypes = [
                        "application/pdf",
                        "image/jpeg",
                        "image/png",
                        "image/gif",
                        "application/msword",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        "application/vnd.ms-excel",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        "application/vnd.ms-powerpoint",
                        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                    ];
                    const isValidType = allowedTypes.includes(file.type);
                    const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
                    if (!isValidType) {
                        toast.error(`${file.name}: Invalid file type. Only PDF, image, or Office files allowed.`);
                        return false;
                    }
                    if (!isValidSize) {
                        toast.error(`${file.name}: File exceeds 5MB limit.`);
                        return false;
                    }
                    return true;
                }).slice(0, 3);

                if (validFiles.length !== files.length) {
                    toast.error("Some files were invalid and excluded.");
                }

                handleInputChange("attachments", validFiles);
            }
        },
        [handleInputChange]
    );

    const handleUpdateCampaign = useCallback(async () => {
        const formData = new FormData();
        if (newCampaign.name) formData.append("name", newCampaign.name);
        if (newCampaign.subject) formData.append("subject", newCampaign.subject);
        if (htmlContent) formData.append("htmlContent", htmlContent);
        if (newCampaign.emailListId) formData.append("emailListId", newCampaign.emailListId);
        if (newCampaign.scheduledAt) formData.append("scheduledAt", newCampaign.scheduledAt);
        newCampaign.attachments.forEach((file) => {
            formData.append("attachments", file);
        });

        try {
            await updateEmailCampaign({ id: campaignId, formData }).unwrap();
            toast.success("Campaign updated successfully!");
            onCancel();
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(getErrorMessage(error));
            console.error("Campaign update error:", error);
        }
    }, [newCampaign, htmlContent, updateEmailCampaign, campaignId, onCancel, onSuccess]);

    const characterCount = htmlContent.replace(/<[^>]+>/g, "").length;
    const maxCharacters = 10000;
    const isOverLimit = characterCount > maxCharacters;

    if (isExternalLoading || isFetching) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Icons.spinner className="h-8 w-8 animate-spin" />
                    <p className="text-muted-foreground">Loading campaign data...</p>
                </div>
            </div>
        );
    }

    if (externalError || fetchError) {
        return (
            <div className="flex items-center justify-center h-[400px] text-destructive">
                <p>Error: {getErrorMessage(externalError || fetchError)}</p>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="flex items-center justify-center h-[400px] text-destructive">
                <p>Campaign not found</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full p-4 bg-gray-50 rounded-lg">
            <motion.div
                className="w-full lg:w-[30%] space-y-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="shadow-lg border border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold">Campaign Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Campaign Name</Label>
                            <Input
                                id="name"
                                type="text"
                                value={newCampaign.name}
                                onChange={(e) => handleInputChange("name", e.target.value)}
                                placeholder="e.g., Summer Recruitment Campaign"
                                disabled={isUpdating}
                                className="focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                type="text"
                                value={newCampaign.subject}
                                onChange={(e) => handleInputChange("subject", e.target.value)}
                                placeholder="e.g., Join Our Recruitment Program!"
                                disabled={isUpdating}
                                className="focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="emailList">Email List</Label>
                            <Select
                                value={newCampaign.emailListId}
                                onValueChange={(value) => handleInputChange("emailListId", value)}
                                disabled={isUpdating || memoizedEmailLists.length === 0}
                            >
                                <SelectTrigger className="focus-visible:ring-2 focus-visible:ring-primary/50">
                                    <SelectValue placeholder="Select Email List" />
                                </SelectTrigger>
                                <SelectContent>
                                    {memoizedEmailLists.map((list) => (
                                        <SelectItem key={list.id} value={list.id.toString()}>
                                            {list.name} ({list.users.length + list.guestUsers.length} recipients)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {memoizedEmailLists.length === 0 && (
                                <p className="text-xs text-muted-foreground">No email lists available</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="scheduledAt">Schedule (Optional)</Label>
                            <Input
                                id="scheduledAt"
                                type="datetime-local"
                                value={newCampaign.scheduledAt}
                                onChange={(e) => handleInputChange("scheduledAt", e.target.value)}
                                disabled={isUpdating}
                                className="focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="attachments">Attachments (Max 3, 5MB each)</Label>
                            <div className="flex items-center gap-2">
                                <label
                                    htmlFor="attachments"
                                    className={`flex-1 cursor-pointer border rounded-md p-2 text-sm transition-colors ${
                                        isUpdating ? "bg-muted/50 cursor-not-allowed" : "hover:bg-gray-100"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Icons.paperclip className="h-4 w-4" />
                                        <span>
                      {newCampaign.attachments.length > 0
                          ? `${newCampaign.attachments.length} files selected`
                          : "Select PDF, image, or Office files"}
                    </span>
                                    </div>
                                    <input
                                        id="attachments"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                        multiple
                                        onChange={handleFileChange}
                                        disabled={isUpdating}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            {newCampaign.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    <p className="text-sm font-medium">New Attachments:</p>
                                    {newCampaign.attachments.map((file, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Icons.file className="h-4 w-4" />
                                            <span className="truncate flex-1">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                            <button
                                                onClick={() => {
                                                    const newAttachments = [...newCampaign.attachments];
                                                    newAttachments.splice(index, 1);
                                                    handleInputChange("attachments", newAttachments);
                                                }}
                                                className="text-destructive hover:text-destructive/80"
                                            >
                                                <Icons.x className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {campaign.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    <p className="text-sm font-medium">Current Attachments:</p>
                                    {campaign.attachments.map((attachment: Attachment) => (
                                        <div key={attachment.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Icons.file className="h-4 w-4" />
                                            <span className="truncate flex-1">{attachment.fileName} ({(attachment.size / 1024 / 1024).toFixed(2)} MB)</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={onCancel}
                                disabled={isUpdating}
                                className="flex-1 hover:bg-gray-100"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdateCampaign}
                                disabled={isUpdating || memoizedEmailLists.length === 0}
                                className="flex-1 gap-2 bg-primary hover:bg-primary/90"
                            >
                                {isUpdating ? (
                                    <>
                                        <Icons.spinner className="h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Icons.send className="h-4 w-4" />
                                        Update Campaign
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
            <motion.div
                className="w-full lg:w-[70%] flex flex-col"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
            >
                <Card className="flex-1 flex flex-col shadow-lg border border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-xl font-semibold">Email Content</CardTitle>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <Icons.info className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Type your email content above the footer. Use the toolbar to format text, add links, images, or tables. The footer is non-editable.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden">
                        <div className="h-full flex flex-col">
                            <div className="flex-1 min-h-[600px] border rounded-lg overflow-hidden">
                                <EmailEditor
                                    content={htmlContent}
                                    onChange={handleHtmlContentChange}
                                    disabled={isUpdating}
                                    init={{
                                        height: "100%",
                                        min_height: 600,
                                        autoresize_bottom_margin: 20,
                                        resize: true,
                                    }}
                                />
                            </div>
                            <div className="px-4 py-2 text-xs flex justify-between items-center border-t">
                <span className={isOverLimit ? "text-destructive" : "text-muted-foreground"}>
                  {characterCount} / {maxCharacters} characters
                    {isOverLimit && " (reduce content for better deliverability)"}
                </span>
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => {
                                        setHtmlContent(`<h1>Your Email Heading</h1><p>Type your email content here...</p>${defaultFooter}`);
                                        toast.info("Content reset to default");
                                    }}
                                >
                                    Reset Content
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default UpdateCampaignForm;