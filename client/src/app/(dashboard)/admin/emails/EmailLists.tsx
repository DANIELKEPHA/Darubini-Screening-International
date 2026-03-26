import React from "react";
import { Send, Users } from "lucide-react";
import { motion } from "framer-motion";
import { EmailCampaign, EmailList, User, GuestUser } from "@/types/prismaTypes";
import { useSendEmailCampaignMutation } from "@/state/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EmailListsProps {
    emailLists?: EmailList[];
    isLoading: boolean;
    selectedListId: number | null;
    onSelectList: (id: number) => void;
}

const EmailLists: React.FC<EmailListsProps> = ({
                                                   emailLists = [],
                                                   isLoading,
                                                   selectedListId,
                                                   onSelectList,
                                               }) => {
    const [sendEmailCampaign] = useSendEmailCampaignMutation();

    const handleSendCampaign = async (campaignId: number) => {
        try {
            await sendEmailCampaign({ id: campaignId }).unwrap();
            toast.success("Campaign sent successfully to all recipients!");
        } catch (error) {
            toast.error("Failed to send campaign");
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">Email Lists</CardTitle>
            </CardHeader>
            <CardContent>
                {emailLists.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No email lists found</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {emailLists.map((list) => (
                            <EmailListCard
                                key={list.id}
                                list={list}
                                isSelected={selectedListId === list.id}
                                onSelect={onSelectList}
                                onSendCampaign={handleSendCampaign}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

interface EmailListCardProps {
    list: EmailList;
    isSelected: boolean;
    onSelect: (id: number) => void;
    onSendCampaign: (campaignId: number) => void;
}

const EmailListCard: React.FC<EmailListCardProps> = ({
                                                         list,
                                                         isSelected,
                                                         onSelect,
                                                         onSendCampaign,
                                                     }) => {
    const [showRecipients, setShowRecipients] = React.useState(false);

    return (
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            className={`h-full border rounded-xl overflow-hidden shadow-md transition-all ${
                isSelected
                    ? "border-primary ring-2 ring-primary"
                    : "border-gray-200 hover:shadow-lg"
            }`}
        >
            <div
                className="h-full flex flex-col cursor-pointer"
                onClick={() => onSelect(list.id)}
            >
                <div className="p-4 flex-grow">
                    <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-800 truncate">{list.name}</h3>
                        <Badge variant="secondary" className="flex-shrink-0">
                            <Users className="h-3 w-3 mr-1" />
                            {list.users.length + list.guestUsers.length}
                        </Badge>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowRecipients(!showRecipients);
                        }}
                    >
                        {showRecipients ? "Hide Recipients" : "Show Recipients"}
                    </Button>

                    {showRecipients && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-2 overflow-hidden"
                        >
                            <div className="p-2 bg-gray-50 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-600 mb-1">Recipients</h4>
                                <ul className="space-y-1 text-sm text-gray-600 max-h-40 overflow-y-auto">
                                    {list.users.map((user: User) => (
                                        <li key={user.id} className="truncate">
                                            {user.email} {user.name && `(${user.name})`}
                                        </li>
                                    ))}
                                    {list.guestUsers.map((guest: GuestUser) => (
                                        <li key={guest.id} className="truncate">
                                            {guest.email} {guest.name && `(${guest.name})`}
                                        </li>
                                    ))}
                                    {list.users.length + list.guestUsers.length === 0 && (
                                        <li className="text-gray-500">No recipients</li>
                                    )}
                                </ul>
                            </div>
                        </motion.div>
                    )}
                </div>

                {list.emailCampaigns?.length > 0 && (
                    <div className="border-t border-gray-200 p-3 bg-gray-50">
                        <h4 className="text-xs font-medium text-gray-500 mb-2">CAMPAIGNS</h4>
                        <div className="space-y-2">
                            {list.emailCampaigns?.map((campaign: EmailCampaign) => (
                                <CampaignCard
                                    key={campaign.id}
                                    campaign={campaign}
                                    onSend={onSendCampaign}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

interface CampaignCardProps {
    campaign: EmailCampaign;
    onSend: (id: number) => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onSend }) => {
    return (
        <motion.div
            className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="flex justify-between items-center">
                <div className="flex-grow min-w-0">
                    <h4 className="font-medium text-gray-700 truncate">{campaign.name}</h4>
                    <StatusBadge status={campaign.status} />
                </div>
                <SendButton status={campaign.status} onSend={() => onSend(campaign.id)} />
            </div>
        </motion.div>
    );
};

interface StatusBadgeProps {
    status: EmailCampaign["status"];
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => (
    <Badge
        className={`text-xs px-2 py-0.5 rounded-full mt-1 ${
            status === "SENT"
                ? "bg-green-100 text-green-800"
                : status === "DRAFT"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
        }`}
    >
        {status}
    </Badge>
);

interface SendButtonProps {
    status: EmailCampaign["status"];
    onSend: () => void;
}

const SendButton: React.FC<SendButtonProps> = ({ status, onSend }) => (
    <motion.button
        onClick={(e) => {
            e.stopPropagation();
            onSend();
        }}
        disabled={status === "SENT"}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
            status === "SENT"
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary/90"
        }`}
    >
        <Send className="h-3 w-3" /> Send
    </motion.button>
);

export default EmailLists;