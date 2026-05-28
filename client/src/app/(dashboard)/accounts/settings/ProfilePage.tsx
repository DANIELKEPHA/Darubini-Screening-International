"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
    Mail, Phone, IdCard, Calendar, Briefcase, User,
    Award, Globe, Heart, Users, Clock
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {NameTag} from "@/app/(dashboard)/accounts/settings/NameTag";

interface ProfilePageProps {
    authUser: any;
}

export const ProfilePage = ({ authUser }: ProfilePageProps) => {
    const user = authUser?.userInfo || {};

    // Contract Progress Calculation
    const contractProgress = React.useMemo(() => {
        if (!user.contractStartDate || !user.contractEndDate) return null;

        const startDate = new Date(user.contractStartDate);
        const endDate = new Date(user.contractEndDate);
        const today = new Date();

        // Total contract duration in milliseconds
        const totalDuration = endDate.getTime() - startDate.getTime();

        // Time already used
        const elapsedDuration = today.getTime() - startDate.getTime();

        // Remaining time
        const remainingDuration = endDate.getTime() - today.getTime();

        // Convert milliseconds to months (approximate)
        const totalMonths = Math.max(
            1,
            Math.round(totalDuration / (1000 * 60 * 60 * 24 * 30))
        );

        const monthsElapsed = Math.max(
            0,
            Math.round(elapsedDuration / (1000 * 60 * 60 * 24 * 30))
        );

        const monthsRemaining = Math.max(
            0,
            Math.round(remainingDuration / (1000 * 60 * 60 * 24 * 30))
        );

        const progressPercentage =
            totalDuration > 0
                ? Math.min(
                    Math.max(
                        Math.round((elapsedDuration / totalDuration) * 100),
                        0
                    ),
                    100
                )
                : 0;

        return {
            totalMonths,
            monthsElapsed,
            monthsRemaining,
            progressPercentage,
            isExpired: today > endDate,
        };
    }, [user.contractStartDate, user.contractEndDate]);

    // Print Name Tag Function
    const printNameTag = () => {
        const nameTagElement = document.getElementById("printable-name-tag");
        if (!nameTagElement) return;

        const printWindow = window.open("", "_blank");
        if (printWindow) {
            printWindow.document.write(`
        <html>
          <head>
            <title>Name Tag - ${user.name}</title>
            <style>
              body { 
                margin: 0; 
                padding: 40px; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                background: #f4f4f4; 
              }
              @media print { 
                body { padding: 0; background: white; } 
              }
            </style>
          </head>
          <body>${nameTagElement.outerHTML}</body>
        </html>
      `);
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 600);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 90 }}
            className="min-h-screen w-full bg-gray-50"
        >
            <div className="w-full px-0">
                <Card className="w-full min-h-screen bg-white border-0 shadow-none overflow-hidden">
                    <div className="flex flex-row min-h-screen">

                        {/* Left Side - Profile + NameTag */}
                        <div className="w-[30%] bg-gray-50 flex flex-col items-center p-0">

                            {/* Profile Image */}
                            <div className="relative w-full">
                                <div className="w-full aspect-square overflow-hidden shadow-xl border border-white">
                                    {user.profilePicture ? (
                                        <Image
                                            src={user.profilePicture}
                                            alt={user.name || "User"}
                                            width={320}
                                            height={320}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                                            <User className="w-24 h-24 text-gray-600" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Name Tag */}
                            <div className="w-full p-2">
                                <NameTag user={user} />
                            </div>

                            {/* Print Button */}
                            <button
                                onClick={printNameTag}
                                className="mb-8 w-[280px] bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                            >
                                🖨️ Print Name Tag
                            </button>
                        </div>

                        {/* Right Side - Details */}
                        <div className="w-[70%] p-10 lg:p-16 flex flex-col">

                            {/* Header */}
                            <div className="mb-10">
                                <h1 className="text-5xl font-semibold text-gray-900 mb-3">
                                    {user.name || "Staff Name"}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4">
                                    <Badge className="bg-blue-600 text-white text-lg px-5 py-1.5">
                                        {authUser?.userRole || "Staff Member"}
                                    </Badge>
                                    {user.department && (
                                        <Badge variant="outline" className="text-sm">
                                            {user.department}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Bio */}
                            {user.bio && (
                                <p className="text-gray-600 text-lg leading-relaxed mb-12 max-w-3xl">
                                    {user.bio}
                                </p>
                            )}

                            <div className="space-y-12">

                                {/* Contact Information */}
                                <div>
                                    <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-6">
                                        Contact Information
                                    </h3>
                                    <div className="space-y-6">
                                        <Info icon={<Mail />} label="Email" value={user.email} />
                                        <Info icon={<Phone />} label="Phone" value={user.phoneNumber} />
                                        {user.idNumber && (
                                            <Info icon={<IdCard />} label="ID Number" value={user.idNumber} />
                                        )}
                                    </div>
                                </div>

                                {/* Employment Details */}
                                <div>
                                    <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4" /> Employment Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {user.department && (
                                            <Info icon={<Briefcase />} label="Department" value={user.department} />
                                        )}
                                        {user.supervisor && (
                                            <Info icon={<Users />} label="Supervisor" value={user.supervisor} />
                                        )}
                                        {user.dateOfHire && (
                                            <Info
                                                icon={<Calendar />}
                                                label="Date of Hire"
                                                value={new Date(user.dateOfHire).toLocaleDateString()}
                                            />
                                        )}
                                        {user.contractStartDate && (
                                            <Info
                                                icon={<Calendar />}
                                                label="Contract Start Date"
                                                value={new Date(user.contractStartDate).toLocaleDateString()}
                                            />
                                        )}
                                        {user.contractEndDate && (
                                            <Info
                                                icon={<Calendar />}
                                                label="Contract End Date"
                                                value={new Date(user.contractEndDate).toLocaleDateString()}
                                            />
                                        )}
                                        {user.contractType && (
                                            <Info icon={<Award />} label="Contract Type" value={user.contractType} />
                                        )}
                                        {user.contractPeriod && (
                                            <Info
                                                icon={<Calendar />}
                                                label="Contract Period"
                                                value={`${user.contractPeriod} months`}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* ==================== CONTRACT PROGRESS BAR ==================== */}
                                {contractProgress && (
                                    <div className="bg-violet-50 border border-violet-100 rounded-2xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-violet-600" />
                                                <h3 className="font-semibold text-gray-800">Contract Progress</h3>
                                            </div>
                                            <Badge
                                                variant={contractProgress.isExpired ? "destructive" : "default"}
                                                className="font-medium"
                                            >
                                                {contractProgress.monthsRemaining} months remaining
                                            </Badge>
                                        </div>

                                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
                                            <div
                                                className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 transition-all duration-700"
                                                style={{ width: `${contractProgress.progressPercentage}%` }}
                                            />
                                        </div>

                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>{contractProgress.monthsElapsed} months used</span>
                                            <span className="font-medium">
                        {contractProgress.totalMonths} months total
                      </span>
                                        </div>
                                    </div>
                                )}

                                {/* Personal Information */}
                                <div>
                                    <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                                        <Heart className="w-4 h-4" /> Personal Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {user.dateOfBirth && (
                                            <Info
                                                icon={<Calendar />}
                                                label="Date of Birth"
                                                value={new Date(user.dateOfBirth).toLocaleDateString()}
                                            />
                                        )}
                                        {user.gender && (
                                            <Info icon={<User />} label="Gender" value={user.gender} />
                                        )}
                                        {user.nationality && (
                                            <Info icon={<Globe />} label="Nationality" value={user.nationality} />
                                        )}
                                        {user.language && (
                                            <Info icon={<Globe />} label="Language" value={user.language} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </motion.div>
    );
};

/* Reusable Info Component */
function Info({ icon, label, value }: {
    icon: React.ReactNode;
    label: string;
    value?: string;
}) {
    if (!value) return null;
    return (
        <div className="flex gap-5">
            <div className="p-4 bg-gray-100 rounded-xl text-gray-600 flex-shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-gray-900 font-medium text-lg">{value}</p>
            </div>
        </div>
    );
}