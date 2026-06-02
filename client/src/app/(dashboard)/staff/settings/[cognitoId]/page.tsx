"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {
    Mail, Phone, IdCard, Calendar, Briefcase, User,
    Award, Globe, Heart, Users, Clock, Edit2, Save, X,
    Camera, Building, ArrowLeft
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useGetUserByCognitoIdQuery, useUpdateUserMutation } from "@/state/api";

export default function StaffProfilePage() {
    const router = useRouter();
    const { cognitoId } = useParams<{ cognitoId: string }>();
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState<any>({});

    const { data, isLoading, isError, refetch } = useGetUserByCognitoIdQuery({
        cognitoId,
        role: "staff",
    });

    const [updateUser] = useUpdateUserMutation();

    if (isLoading) return (
        <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading profile...</p>
            </div>
        </div>
    );

    if (isError || !data) return (
        <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <p className="text-red-500 text-lg">Failed to load user profile</p>
                <button
                    onClick={() => refetch()}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                    Try Again
                </button>
            </div>
        </div>
    );

    const user = data;

    const handleEdit = () => {
        setEditedData(user);
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            await updateUser({ cognitoId, ...editedData }).unwrap();
            setIsEditing(false);
            refetch();
        } catch (error) {
            console.error("Failed to update user:", error);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedData({});
    };

    const handleChange = (field: string, value: string) => {
        setEditedData((prev: any) => ({ ...prev, [field]: value }));
    };

    // Contract Progress Calculation
    const contractProgress = (() => {
        const startDate = editedData.contractStartDate || user.contractStartDate;
        const endDate = editedData.contractEndDate || user.contractEndDate;

        if (!startDate || !endDate) return null;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();

        const totalDuration = end.getTime() - start.getTime();
        const elapsedDuration = today.getTime() - start.getTime();
        const remainingDuration = end.getTime() - today.getTime();

        const totalMonths = Math.max(1, Math.round(totalDuration / (1000 * 60 * 60 * 24 * 30)));
        const monthsElapsed = Math.max(0, Math.round(elapsedDuration / (1000 * 60 * 60 * 24 * 30)));
        const monthsRemaining = Math.max(0, Math.round(remainingDuration / (1000 * 60 * 60 * 24 * 30)));
        const progressPercentage = totalDuration > 0 ? Math.min(Math.max(Math.round((elapsedDuration / totalDuration) * 100), 0), 100) : 0;

        return { totalMonths, monthsElapsed, monthsRemaining, progressPercentage, isExpired: today > end };
    })();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 90 }}
            className="min-h-screen w-full bg-gray-50"
        >
            <div className="w-full px-0">
                <Card className="w-full min-h-screen bg-white border-0 shadow-none overflow-hidden">
                    {/* Back Button Row */}
                    <div className="px-6 pt-6">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span>Back</span>
                        </button>
                    </div>

                    {/* Edit Mode Header */}
                    {isEditing && (
                        <div className="bg-primary text-white px-6 py-3 flex justify-between items-center mx-6 mt-4 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Edit2 className="w-5 h-5" />
                                <span className="font-medium">Edit Mode</span>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="px-4 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" /> Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-1 bg-secondary text-white rounded-lg hover:bg-secondary-600 transition-colors flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" /> Save Changes
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-row min-h-screen">
                        {/* Left Side - Profile + Edit Button */}
                        <div className="w-[30%] bg-gray-50 flex flex-col items-center p-0 relative">
                            {/* Edit Profile Button */}
                            {!isEditing && (
                                <button
                                    onClick={handleEdit}
                                    className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all hover:bg-gray-50"
                                >
                                    <Edit2 className="w-5 h-5 text-primary" />
                                </button>
                            )}

                            {/* Profile Image */}
                            <div className="relative w-full">
                                <div className="w-full aspect-square overflow-hidden shadow-xl border-4 border-white">
                                    {isEditing ? (
                                        <div className="relative w-full h-full group cursor-pointer">
                                            {editedData.profilePicture ? (
                                                <Image
                                                    src={editedData.profilePicture}
                                                    alt={editedData.name || user.name || "User"}
                                                    width={320}
                                                    height={320}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                                                    <User className="w-24 h-24 text-primary-400" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Camera className="w-8 h-8 text-white" />
                                            </div>
                                        </div>
                                    ) : (
                                        user.profilePicture ? (
                                            <Image
                                                src={user.profilePicture}
                                                alt={user.name || "User"}
                                                width={320}
                                                height={320}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                                                <User className="w-24 h-24 text-primary-400" />
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Basic Info Card */}
                            <div className="w-full p-6 space-y-4">
                                <div className="text-center">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedData.name || user.name || ""}
                                            onChange={(e) => handleChange("name", e.target.value)}
                                            className="text-2xl font-bold text-center w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary"
                                            placeholder="Full Name"
                                        />
                                    ) : (
                                        <h2 className="text-2xl font-bold text-gray-900">{user.name || "Staff Name"}</h2>
                                    )}
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            value={editedData.email || user.email || ""}
                                            onChange={(e) => handleChange("email", e.target.value)}
                                            className="text-gray-500 text-center w-full border rounded-lg px-3 py-1 mt-1 focus:ring-2 focus:ring-primary"
                                            placeholder="Email"
                                        />
                                    ) : (
                                        <p className="text-gray-500">{user.email}</p>
                                    )}
                                    <Badge className="mt-2 bg-primary text-white">
                                        {user.userType || "Staff Member"}
                                    </Badge>
                                </div>

                                {/* Quick Stats */}
                                <div className="border-t pt-4 mt-4 space-y-3">
                                    <StatItem label="ID Number" value={user.idNumber} />
                                    <StatItem label="Phone" value={user.phoneNumber} />
                                    <StatItem label="Department" value={user.department} />
                                    <StatItem label="Role" value={user.userType} />
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Editable Details */}
                        <div className="w-[70%] p-10 lg:p-16 flex flex-col overflow-y-auto max-h-screen">
                            {/* Bio Section */}
                            <div className="mb-10">
                                <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-3">Bio</h3>
                                {isEditing ? (
                                    <textarea
                                        value={editedData.bio || user.bio || ""}
                                        onChange={(e) => handleChange("bio", e.target.value)}
                                        rows={4}
                                        className="w-full border rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-primary"
                                        placeholder="Write a bio..."
                                    />
                                ) : (
                                    <p className="text-gray-600 text-lg leading-relaxed">
                                        {user.bio || "No bio provided"}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-12">
                                {/* Contact Information */}
                                <Section title="Contact Information" icon={<Mail className="w-4 h-4" />}>
                                    <EditableInfo
                                        icon={<Mail />}
                                        label="Email"
                                        value={user.email}
                                        isEditing={isEditing}
                                        editedValue={editedData.email}
                                        onEditChange={(val) => handleChange("email", val)}
                                    />
                                    <EditableInfo
                                        icon={<Phone />}
                                        label="Phone"
                                        value={user.phoneNumber}
                                        isEditing={isEditing}
                                        editedValue={editedData.phoneNumber}
                                        onEditChange={(val) => handleChange("phoneNumber", val)}
                                    />
                                    <EditableInfo
                                        icon={<IdCard />}
                                        label="ID Number"
                                        value={user.idNumber}
                                        isEditing={isEditing}
                                        editedValue={editedData.idNumber}
                                        onEditChange={(val) => handleChange("idNumber", val)}
                                    />
                                </Section>

                                {/* Employment Details */}
                                <Section title="Employment Details" icon={<Briefcase className="w-4 h-4" />}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <EditableInfo
                                            icon={<Building />}
                                            label="Department"
                                            value={user.department}
                                            isEditing={isEditing}
                                            editedValue={editedData.department}
                                            onEditChange={(val) => handleChange("department", val)}
                                        />
                                        <EditableInfo
                                            icon={<Users />}
                                            label="Supervisor"
                                            value={user.supervisor}
                                            isEditing={isEditing}
                                            editedValue={editedData.supervisor}
                                            onEditChange={(val) => handleChange("supervisor", val)}
                                        />
                                        <EditableInfo
                                            icon={<Calendar />}
                                            label="Date of Hire"
                                            value={user.dateOfHire ? new Date(user.dateOfHire).toLocaleDateString() : undefined}
                                            isEditing={isEditing}
                                            editedValue={editedData.dateOfHire}
                                            onEditChange={(val) => handleChange("dateOfHire", val)}
                                            type="date"
                                        />
                                        <EditableInfo
                                            icon={<Award />}
                                            label="Contract Type"
                                            value={user.contractType}
                                            isEditing={isEditing}
                                            editedValue={editedData.contractType}
                                            onEditChange={(val) => handleChange("contractType", val)}
                                        />
                                        <EditableInfo
                                            icon={<Calendar />}
                                            label="Contract Start"
                                            value={user.contractStartDate ? new Date(user.contractStartDate).toLocaleDateString() : undefined}
                                            isEditing={isEditing}
                                            editedValue={editedData.contractStartDate}
                                            onEditChange={(val) => handleChange("contractStartDate", val)}
                                            type="date"
                                        />
                                        <EditableInfo
                                            icon={<Calendar />}
                                            label="Contract End"
                                            value={user.contractEndDate ? new Date(user.contractEndDate).toLocaleDateString() : undefined}
                                            isEditing={isEditing}
                                            editedValue={editedData.contractEndDate}
                                            onEditChange={(val) => handleChange("contractEndDate", val)}
                                            type="date"
                                        />
                                        <EditableInfo
                                            icon={<Clock />}
                                            label="Contract Period (months)"
                                            value={user.contractPeriod}
                                            isEditing={isEditing}
                                            editedValue={editedData.contractPeriod}
                                            onEditChange={(val) => handleChange("contractPeriod", val)}
                                        />
                                    </div>
                                </Section>

                                {/* Contract Progress Bar */}
                                {contractProgress && !isEditing && (
                                    <div className="bg-primary-50 border border-primary-100 rounded-2xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-primary" />
                                                <h3 className="font-semibold text-gray-800">Contract Progress</h3>
                                            </div>
                                            <Badge variant={contractProgress.isExpired ? "destructive" : "default"} className="font-medium bg-primary text-white">
                                                {contractProgress.monthsRemaining} months remaining
                                            </Badge>
                                        </div>
                                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-700"
                                                style={{ width: `${contractProgress.progressPercentage}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>{contractProgress.monthsElapsed} months used</span>
                                            <span className="font-medium">{contractProgress.totalMonths} months total</span>
                                        </div>
                                    </div>
                                )}

                                {/* Personal Information */}
                                <Section title="Personal Information" icon={<Heart className="w-4 h-4" />}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <EditableInfo
                                            icon={<Calendar />}
                                            label="Date of Birth"
                                            value={user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : undefined}
                                            isEditing={isEditing}
                                            editedValue={editedData.dateOfBirth}
                                            onEditChange={(val) => handleChange("dateOfBirth", val)}
                                            type="date"
                                        />
                                        <EditableInfo
                                            icon={<User />}
                                            label="Gender"
                                            value={user.gender}
                                            isEditing={isEditing}
                                            editedValue={editedData.gender}
                                            onEditChange={(val) => handleChange("gender", val)}
                                        />
                                        <EditableInfo
                                            icon={<Globe />}
                                            label="Nationality"
                                            value={user.nationality}
                                            isEditing={isEditing}
                                            editedValue={editedData.nationality}
                                            onEditChange={(val) => handleChange("nationality", val)}
                                        />
                                        <EditableInfo
                                            icon={<Globe />}
                                            label="Language"
                                            value={user.language}
                                            isEditing={isEditing}
                                            editedValue={editedData.language}
                                            onEditChange={(val) => handleChange("language", val)}
                                        />
                                    </div>
                                </Section>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </motion.div>
    );
}

// Helper Components
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                {icon} {title}
            </h3>
            <div className="space-y-6">
                {children}
            </div>
        </div>
    );
}

function EditableInfo({
                          icon, label, value, isEditing, editedValue, onEditChange, type = "text"
                      }: {
    icon: React.ReactNode;
    label: string;
    value?: string;
    isEditing: boolean;
    editedValue?: string;
    onEditChange: (val: string) => void;
    type?: string;
}) {
    if (!value && !isEditing) return null;

    return (
        <div className="flex gap-5">
            <div className="p-4 bg-gray-100 rounded-xl text-gray-600 flex-shrink-0">
                {icon}
            </div>
            <div className="flex-1">
                <p className="text-sm text-gray-500">{label}</p>
                {isEditing ? (
                    type === "textarea" ? (
                        <textarea
                            value={editedValue || value || ""}
                            onChange={(e) => onEditChange(e.target.value)}
                            className="text-gray-900 font-medium text-lg w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-primary"
                            rows={3}
                        />
                    ) : (
                        <input
                            type={type}
                            value={editedValue || value || ""}
                            onChange={(e) => onEditChange(e.target.value)}
                            className="text-gray-900 font-medium text-lg w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-primary"
                        />
                    )
                ) : (
                    <p className="text-gray-900 font-medium text-lg">{value || "N/A"}</p>
                )}
            </div>
        </div>
    );
}

function StatItem({ label, value }: { label: string; value?: string }) {
    if (!value) return null;
    return (
        <div>
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-gray-700 font-medium">{value}</p>
        </div>
    );
}