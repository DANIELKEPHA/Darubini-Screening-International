"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settingsSchema, SettingsFormData } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    User, Mail, Phone, Save, Camera, AtSign, Smartphone, IdCard,
    Calendar, Briefcase, Users, Globe, Heart, Award
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

interface ProfileEditFormProps {
    authUser: any;
    onSubmit: (data: SettingsFormData) => Promise<void>;
    isLoading?: boolean;
}

export const ProfileEditForm = ({ authUser, onSubmit, isLoading }: ProfileEditFormProps) => {
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

    const form = useForm<SettingsFormData>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            name: "",
            email: "",
            phoneNumber: "",
            idNumber: "",
            supervisor: "",
            bio: "",
            dateOfHire: "",
            contractType: "",
            contractPeriod: "",
            department: "",
            dateOfBirth: "",
            gender: "",
            nationality: "",
            language: "",
        },
    });

    // Load existing data
    React.useEffect(() => {
        if (authUser?.userInfo) {
            const user = authUser.userInfo;
            form.reset({
                name: user.name || "",
                email: user.email || "",
                phoneNumber: user.phoneNumber || "",
                idNumber: user.idNumber || "",
                supervisor: user.supervisor || "",
                bio: user.bio || "",
                dateOfHire: user.dateOfHire ? user.dateOfHire.split('T')[0] : "",
                contractType: user.contractType || "",
                contractPeriod: user.contractPeriod || "",
                department: user.department || "",
                dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : "",
                gender: user.gender || "",
                nationality: user.nationality || "",
                language: user.language || "",
            });

            if (user.profilePicture) {
                setPreviewUrl(user.profilePicture);
            }
        }
    }, [authUser, form]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
            form.setValue("profilePicture", file, { shouldValidate: true, shouldDirty: true });
        }
    };

    const handleSubmit = async (data: SettingsFormData) => {
        await onSubmit(data);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 90 }}
        >
            <Card className="bg-white border border-gray-200 shadow-md rounded-lg overflow-hidden">
                <CardHeader className="bg-gray-50 border-b border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative flex-shrink-0">
                            <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-100">
                                {previewUrl ? (
                                    <Image
                                        src={previewUrl}
                                        alt="Profile Preview"
                                        width={96}
                                        height={96}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-12 h-12 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors cursor-pointer">
                                <Camera className="w-4 h-4 text-gray-600" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </label>
                        </div>

                        <div className="text-center sm:text-left">
                            <h2 className="text-2xl font-semibold text-gray-900">Profile Information</h2>
                            <p className="text-gray-500 mt-1 text-sm">Update your personal and employment details</p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                        {/* Basic Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {/* Name, Email, Phone, ID Number - Existing fields */}
                                {/* ... (keeping your existing fields) */}
                                <div className="space-y-2">
                                    <Label className="text-gray-700 text-sm font-medium flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-500" /> Full Name
                                    </Label>
                                    <div className="relative">
                                        <Input {...form.register("name")} className="h-10 pl-9" placeholder="Enter your full name" />
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-700 text-sm font-medium flex items-center gap-2">
                                        <AtSign className="w-4 h-4 text-gray-500" /> Email Address
                                    </Label>
                                    <div className="relative">
                                        <Input {...form.register("email")} type="email" className="h-10 pl-9" />
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-700 text-sm font-medium flex items-center gap-2">
                                        <Smartphone className="w-4 h-4 text-gray-500" /> Phone Number
                                    </Label>
                                    <div className="relative">
                                        <Input {...form.register("phoneNumber")} className="h-10 pl-9" />
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-700 text-sm font-medium flex items-center gap-2">
                                        <IdCard className="w-4 h-4 text-gray-500" /> ID Number
                                    </Label>
                                    <div className="relative">
                                        <Input {...form.register("idNumber")} className="h-10 pl-9" />
                                        <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Employment Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Briefcase className="w-5 h-5" /> Employment Details
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label>Department</Label>
                                    <Input {...form.register("department")} placeholder="e.g. Operations, Sales, HR" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Supervisor</Label>
                                    <Input {...form.register("supervisor")} placeholder="Supervisor Name" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Date of Hire</Label>
                                    <Input type="date" {...form.register("dateOfHire")} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contract Type</Label>
                                    <select {...form.register("contractType")} className="h-10 w-full border border-gray-300 rounded-md px-3">
                                        <option value="">Select Contract Type</option>
                                        <option value="Full-time">Full-time</option>
                                        <option value="Part-time">Part-time</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Permanent">Permanent</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Contract Period</Label>
                                    <Input {...form.register("contractPeriod")} placeholder="e.g. 12 months, Permanent" />
                                </div>
                            </div>
                        </div>

                        {/* Personal Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Heart className="w-5 h-5" /> Personal Information
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label>Date of Birth</Label>
                                    <Input type="date" {...form.register("dateOfBirth")} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gender</Label>
                                    <select {...form.register("gender")} className="h-10 w-full border border-gray-300 rounded-md px-3">
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Nationality</Label>
                                    <Input {...form.register("nationality")} placeholder="e.g. Kenyan" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Language</Label>
                                    <Input {...form.register("language")} placeholder="e.g. English, Swahili" />
                                </div>
                            </div>

                            <div className="space-y-2 mt-5">
                                <Label>Bio / About</Label>
                                <Textarea
                                    {...form.register("bio")}
                                    placeholder="Write a short bio..."
                                    rows={4}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-6 border-t border-gray-200">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-8 py-2.5 rounded-md transition-colors"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isLoading ? "Saving Changes..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </motion.div>
    );
};