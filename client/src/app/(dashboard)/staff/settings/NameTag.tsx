"use client";

import React from "react";
import Image from "next/image";
import { Phone, Mail, MapPin, Calendar, Briefcase } from "lucide-react";

interface NameTagProps {
    user: any;
}

export const NameTag = ({ user }: NameTagProps) => {
    return (
        <div
            id="printable-name-tag"
            className="relative group w-full"
        >
            {/* Card Shadow & Depth */}
            <div className="absolute inset-0 bg-black/10 rounded-xl blur-md transform translate-y-1" />

            {/* Main Card - Now takes full width with generous height */}
            <div className="relative w-full min-h-[280px] bg-white rounded-xl overflow-hidden shadow-lg transition-transform duration-200 hover:scale-105 cursor-pointer">

                {/* Left colored accent bar - like real cards */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-600 to-blue-800" />

                {/* Content Container - Vertically centered with more padding */}
                <div className="h-full p-6 pl-7 flex items-center">
                    {/* Left Side - Photo & Basic Info */}
                    <div className="flex-shrink-0 w-32 mr-5">
                        {/* Profile Photo - Larger for better proportion */}
                        <div className="w-28 h-28 rounded-full overflow-hidden border-3 border-gray-200 shadow-md bg-gray-50 mx-auto">
                            {user.profilePicture ? (
                                <Image
                                    src={user.profilePicture}
                                    alt={user.name || "User"}
                                    width={112}
                                    height={112}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-blue-100 to-gray-100">
                                    👤
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side - Details - Takes remaining space with more vertical spacing */}
                    <div className="flex-1 min-w-0">
                        {/* Name & Title */}
                        <div className="mb-3">
                            <h3 className="text-lg font-bold text-gray-900 leading-tight uppercase tracking-wide">
                                {user.name || "JOHN SMITH"}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium mt-1">
                                {user.department || "Corporate Affairs"}
                            </p>
                        </div>

                        {/* Divider line - thin like real cards */}
                        <div className="border-t border-gray-200 my-2" />

                        {/* Contact Info - More spacious layout */}
                        <div className="space-y-2 mt-2">
                            <InfoRow
                                icon={<Briefcase className="w-3.5 h-3.5" />}
                                label="ID"
                                value={user.idNumber || "EMP-2024-001"}
                            />

                            <InfoRow
                                icon={<Phone className="w-3.5 h-3.5" />}
                                label="Tel"
                                value={user.phoneNumber || "+1 234 567 8900"}
                            />

                            {user.email && (
                                <InfoRow
                                    icon={<Mail className="w-3.5 h-3.5" />}
                                    label="Email"
                                    value={user.email}
                                    isEmail
                                />
                            )}

                            {user.contractPeriod && (
                                <InfoRow
                                    icon={<Calendar className="w-3.5 h-3.5" />}
                                    label="Contract"
                                    value={`${user.contractPeriod} mos`}
                                />
                            )}
                        </div>

                        {/* Footer - Company Info with more padding */}
                        <div className="mt-3 pt-2 border-t border-gray-100">
                            <div className="flex justify-between items-center text-[9px] text-gray-400">
                                <span>Valid from: {user.dateOfHire ? new Date(user.dateOfHire).toLocaleDateString() : "2024-01-01"}</span>
                                <span className="font-mono">ID: {user.idNumber?.slice(-6) || "000001"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom watermark effect for realism */}
                <div className="absolute bottom-2 right-3 opacity-5 pointer-events-none">
                    <svg className="w-14 h-14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 13c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z"/>
                    </svg>
                </div>
            </div>
        </div>
    );
};

/* Compact Info Row for Real Name Card */
function InfoRow({
                     icon,
                     label,
                     value,
                     isEmail = false,
                 }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    isEmail?: boolean;
}) {
    return (
        <div className="flex items-center gap-2.5">
            <div className="text-gray-500 flex-shrink-0">
                {icon}
            </div>
            <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {label}:
                </span>
                <span className={`text-[11px] font-medium text-gray-700 truncate ${isEmail ? 'lowercase' : ''}`}>
                    {value}
                </span>
            </div>
        </div>
    );
}