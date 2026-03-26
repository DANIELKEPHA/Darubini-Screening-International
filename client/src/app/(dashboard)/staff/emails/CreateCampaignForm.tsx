import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {EmailCampaign, EmailList} from "@/types/prismaTypes";
import {useCreateEmailCampaignMutation} from "@/state/api";
import {toast} from "sonner";
import {Icons} from "@/components/ui/icons";
import EmailEditor from "@/app/(dashboard)/admin/emails/EmailEditor";

interface CreateCampaignFormProps {
    emailLists?: EmailList[];
    isLoading?: boolean;
    error?: any;
    onCancel: () => void;
    onSuccess?: (campaign: EmailCampaign) => void;
}

const defaultFooter = `
    <hr style="border-top: 1px solid #e0e0e0; margin: 20px 0;" />
    <div style="text-align: center; font-family: Arial, sans-serif; font-size: 12px; color: #555555; line-height: 1.6; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 10px; border-radius: 4px;" contenteditable="false">
        <p><strong>Darubini Screening International Company</strong></p>
        <p>Facilitating Safe Recruitment Decisions</p>
        <p>123 Business Avenue, Nairobi, Kenya</p>
        <p><a href="mailto:relations@darubiniscreening.com">relations@darubiniscreening.com</a> | <a href="https://darubiniscreening.com">www.darubiniscreening.com</a></p>        
    </div>
`;

const maxCharacters = 10000;

export const CreateCampaignForm: React.FC<CreateCampaignFormProps> = ({
                                                                          emailLists = [],
                                                                          isLoading = false,
                                                                          error = null,
                                                                          onCancel,
                                                                          onSuccess,
                                                                      }) => {
    const [newCampaign, setNewCampaign] = useState({
        name: "",
        subject: "",
        emailListId: "",
        scheduledAt: "",
        attachments: [] as File[],
    });
    const [htmlContent, setHtmlContent] = useState(
        `<h1>Your Email Heading</h1><p>Dear {{NAME}},</p><p>Type your email content here...</p>${defaultFooter}`
    );
    const [createEmailCampaign, { isLoading: isCreating }] = useCreateEmailCampaignMutation();

    const memoizedEmailLists = useMemo(() => emailLists, [emailLists]);

    const characterCount = useMemo(() => {
        const div = document.createElement("div");
        div.innerHTML = htmlContent;
        return div.textContent?.length || 0;
    }, [htmlContent]);

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
                    const isValidSize = file.size <= 5 * 1024 * 1024;
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

    const handleCreateCampaign = useCallback(async () => {
        if (!newCampaign.name || !newCampaign.subject || !newCampaign.emailListId) {
            toast.error("Name, subject, and email list are required");
            return;
        }

        const formData = new FormData();
        formData.append("name", newCampaign.name);
        formData.append("subject", newCampaign.subject);
        formData.append("htmlContent", htmlContent);
        formData.append("emailListId", newCampaign.emailListId);
        if (newCampaign.scheduledAt) {
            formData.append("scheduledAt", newCampaign.scheduledAt);
        }
        newCampaign.attachments.forEach((file) => {
            formData.append("attachments", file);
        });

        try {
            const campaign = await createEmailCampaign(formData).unwrap();
            toast.success("Campaign created successfully!");
            onCancel();
            if (onSuccess) onSuccess(campaign);
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to create campaign");
            console.error("Campaign creation error:", error);
        }
    }, [newCampaign, htmlContent, createEmailCampaign, onCancel, onSuccess]);

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
                                disabled={isCreating}
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
                                disabled={isCreating}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="emailList">Email List</Label>
                            <Select
                                value={newCampaign.emailListId}
                                onValueChange={(value) => handleInputChange("emailListId", value)}
                                disabled={isCreating || memoizedEmailLists.length === 0}
                            >
                                <SelectTrigger>
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
                                disabled={isCreating}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="attachments">Attachments (Max 3, 5MB each)</Label>
                            <div className="flex items-center gap-2">
                                <label
                                    htmlFor="attachments"
                                    className={`flex-1 cursor-pointer border rounded-md p-2 text-sm transition-colors ${
                                        isCreating ? "bg-muted/50 cursor-not-allowed" : "hover:bg-gray-100"
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
                                        disabled={isCreating}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            {newCampaign.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {newCampaign.attachments.map((file, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Icons.file className="h-4 w-4" />
                                            <span className="truncate flex-1">
                                                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                            </span>
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
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button variant="outline" onClick={onCancel} disabled={isCreating}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateCampaign}
                                disabled={isCreating || memoizedEmailLists.length === 0}
                                className="flex-1 gap-2 bg-primary hover:bg-primary/90"
                            >
                                {isCreating ? (
                                    <>
                                        <Icons.spinner className="h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Icons.send className="h-4 w-4" />
                                        Create Campaign
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
                                    <p>Use {"{{NAME}}"} as a placeholder for recipient names. The footer is non-editable.</p>
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
                                    disabled={isCreating}
                                    init={{
                                        height: "100%",
                                        min_height: 600,
                                        autoresize_bottom_margin: 20,
                                        resize: true,
                                    }}
                                />
                            </div>
                            <div className="px-4 py-2 text-xs flex justify-between items-center border-t">
                                <span className={characterCount > maxCharacters ? "text-destructive" : "text-muted-foreground"}>
                                    {characterCount} / {maxCharacters} characters
                                    {characterCount > maxCharacters && " (reduce content for better deliverability)"}
                                </span>
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => {
                                        setHtmlContent(
                                            `<h1>Your Email Heading</h1><p>Dear {{NAME}},</p><p>Type your email content here...</p>${defaultFooter}`
                                        );
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
export default CreateCampaignForm;