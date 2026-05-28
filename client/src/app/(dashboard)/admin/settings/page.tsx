"use client";

import * as React from "react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { useGetAuthUserQuery } from "@/state/api";
import { User, Shield, Bell, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ProfileEditForm } from "./ProfileEditForm";
import { ProfilePage } from "./ProfilePage";
import { NotificationPage } from "./NotificationPage";
import { fetchAuthSession } from "aws-amplify/auth";
import Requests from "@/app/(dashboard)/admin/settings/Requests";

const ManagerSettings = () => {
    const { data: authUser, isLoading, error } = useGetAuthUserQuery(undefined, {
        pollingInterval: 0
    });

    const router = useRouter();
    const [activeTab, setActiveTab] = React.useState("overview");
    const [isUpdating, setIsUpdating] = React.useState(false);

    const handleUpdateSettings = async (data: any) => {
        try {
            if (!authUser?.cognitoInfo?.userId) {
                throw new Error("User ID not found");
            }

            setIsUpdating(true);

            const session = await fetchAuthSession();
            const idToken = session.tokens?.idToken?.toString();
            if (!idToken) throw new Error("No authentication token found");

            let response: Response;

            if (data.profilePicture instanceof File) {
                const formData = new FormData();
                formData.append("name", data.name || "");
                formData.append("email", data.email || "");
                formData.append("phoneNumber", data.phoneNumber || "");
                formData.append("idNumber", data.idNumber || "");
                formData.append("supervisor", data.supervisor || "");
                formData.append("bio", data.bio || "");
                formData.append("dateOfHire", data.dateOfHire || "");
                formData.append("contractStartDate", data.contractStartDate || "");
                formData.append("contractEndDate", data.contractEndDat || "")
                formData.append("contractType", data.contractType || "");
                formData.append("contractPeriod", data.contractPeriod || "");
                formData.append("department", data.department || "");
                formData.append("dateOfBirth", data.dateOfBirth || "");
                formData.append("gender", data.gender || "");
                formData.append("nationality", data.nationality || "");
                formData.append("language", data.language || "");
                formData.append("profilePicture", data.profilePicture);

                response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/${authUser.cognitoInfo.userId}`,
                    {
                        method: "PUT",
                        headers: { Authorization: `Bearer ${idToken}` },
                        body: formData,
                    }
                );
            } else {
                response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/${authUser.cognitoInfo.userId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${idToken}`,
                        },
                        body: JSON.stringify(data),
                    }
                );
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to update profile");
            }

            toast.success("Profile updated successfully!");

            // Option 1: Quick fix (same as Admin)
            window.location.reload();

            // Option 2: Better UX (Recommended) - Refetch without reload
            // await refetch();   // if you destructure refetch from the query

        } catch (error: any) {
            console.error("Update error:", error);
            toast.error(`Failed to update profile: ${error.message || "Unknown error"}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 },
        },
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100, damping: 12 },
        },
    };

    const tabs = [
        { id: "overview", label: "Overview", icon: User },
        { id: "profile", label: "Edit Profile", icon: SettingsIcon },
        { id: "requests", label: "Requests", icon: Shield },
        { id: "notifications", label: "Notifications", icon: Bell },
    ];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
                        <SettingsIcon className="w-8 h-8 text-gray-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-gray-600 font-medium">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (error || !authUser || authUser.userRole !== "admin") {
        toast.error("Access denied or user not found");
        router.push("/signin");
        return null;
    }

    return (
        <div className="min-h-screen w-full bg-gray-50">
            <div className="w-full min-h-screen">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="w-full h-full"
                >
                    {/* Header with Horizontal Tabs */}
                    <div className="bg-white border-b border-gray-200">
                        <div className="w-full px-4 sm:px-6 lg:px-8">
                            <div className="flex space-x-8">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                        flex items-center gap-2 px-3 py-4 border-b-2 transition-all duration-200
                        ${activeTab === tab.id
                                            ? "border-gray-900 text-gray-900"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }
                    `}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        <span className="text-sm font-medium">{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                        <motion.div variants={itemVariants}>
                            <AnimatePresence mode="wait">
                                {activeTab === "overview" && <ProfilePage authUser={authUser} />}
                                {activeTab === "profile" && (
                                    <ProfileEditForm
                                        authUser={authUser}
                                        onSubmit={handleUpdateSettings}
                                        isLoading={isUpdating}
                                    />
                                )}
                                {activeTab === "requests" && <Requests />}
                                {activeTab === "notifications" && <NotificationPage />}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ManagerSettings;