"use client";

import React, { useState } from "react";
import { useGetAuthUserQuery, useCreateAdminMutation, useCreateAccountsMutation, useCreateStaffMutation } from "@/state/api";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiPhone, FiLock, FiChevronRight, FiEye, FiEyeOff } from "react-icons/fi";
import { RadioGroupField, Radio, Heading } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Loader2 } from "lucide-react";

const CreateUserPage = () => {
    const { data: authUser, isLoading: isAuthLoading } = useGetAuthUserQuery();
    const router = useRouter();
    const [createAdmin, { isLoading: isAdminLoading, error: adminError, data: adminSuccessData }] = useCreateAdminMutation();
    const [createAccounts, { isLoading: isAccountsLoading, error: accountsError, data: accountsSuccessData }] = useCreateAccountsMutation();
    const [createStaff, { isLoading: isStaffLoading, error: staffError, data: staffSuccessData }] = useCreateStaffMutation();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phoneNumber: "",
        role: "ACCOUNTS" as "ACCOUNTS" | "STAFF" | "ADMIN",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);

    if (isAuthLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!authUser || authUser.userRole !== "admin") {
        router.push("/signin");
        return null;
    }

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, role: e.target.value as "ACCOUNTS" | "STAFF" | "ADMIN" }));
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let result;
            if (formData.role === "ADMIN") {
                result = await createAdmin({
                    name: formData.name,
                    email: formData.email,
                    phoneNumber: formData.phoneNumber,
                    role: "ADMIN",
                    password: formData.password,
                }).unwrap();
            } else if (formData.role === "ACCOUNTS") {
                result = await createAccounts({
                    name: formData.name,
                    email: formData.email,
                    phoneNumber: formData.phoneNumber,
                    role: "ACCOUNTS",
                    password: formData.password,
                }).unwrap();
            } else if (formData.role === "STAFF") {
                result = await createStaff({
                    name: formData.name,
                    email: formData.email,
                    phoneNumber: formData.phoneNumber,
                    role: "STAFF",
                    password: formData.password,
                }).unwrap();
            }
            setFormData({ name: "", email: "", phoneNumber: "", role: "ACCOUNTS", password: "" });
        } catch (err) {
            console.error("Failed to create user:", err);
        }
    };

    const isLoading = isAdminLoading || isAccountsLoading || isStaffLoading;
    const error = adminError || accountsError || staffError;
    const successData = adminSuccessData || accountsSuccessData || staffSuccessData;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
                <Heading level={4} className="!text-xl !font-semibold text-gray-700 mb-1">
                    Create New User
                </Heading>
                <p className="text-gray-500 text-sm mb-6">
                    Fill in the details to create a new user account
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <div className="relative mt-1">
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter full name"
                                required
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <span className="absolute right-3 top-3 text-gray-400">
                                <FiUser />
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <div className="relative mt-1">
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter email address"
                                required
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <span className="absolute right-3 top-3 text-gray-400">
                                <FiMail />
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                        <div className="relative mt-1">
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                placeholder="Enter phone number (e.g., +254123456789)"
                                required
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <span className="absolute right-3 top-3 text-gray-400">
                                <FiPhone />
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <div className="relative mt-1">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Create a password"
                                required
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute right-3 top-3 text-gray-400"
                            >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                    </div>

                    <RadioGroupField
                        legend="User Role"
                        name="role"
                        value={formData.role}
                        onChange={handleRoleChange}
                        isRequired
                        className="radio-group mt-4"
                    >
                        <div className="flex space-x-4">
                            <motion.div whileHover={{ scale: 1.03 }}>
                                <Radio
                                    value="ACCOUNTS"
                                    className="hidden"
                                    id="accounts-radio"
                                />
                                <label
                                    htmlFor="accounts-radio"
                                    className="flex-1 border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-indigo-300 transition-colors"
                                >
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-2">
                                            <span className="text-indigo-600">
                                                <FiUser />
                                            </span>
                                        </div>
                                        <span className="text-gray-700 font-medium">Accounts</span>
                                    </div>
                                </label>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.03 }}>
                                <Radio
                                    value="STAFF"
                                    className="hidden"
                                    id="staff-radio"
                                />
                                <label
                                    htmlFor="staff-radio"
                                    className="flex-1 border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-indigo-300 transition-colors"
                                >
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-2">
                                            <span className="text-indigo-600">
                                                <FiUser />
                                            </span>
                                        </div>
                                        <span className="text-gray-700 font-medium">Staff</span>
                                    </div>
                                </label>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.03 }}>
                                <Radio
                                    value="ADMIN"
                                    className="hidden"
                                    id="admin-radio"
                                />
                                <label
                                    htmlFor="admin-radio"
                                    className="flex-1 border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-indigo-300 transition-colors"
                                >
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-2">
                                            <span className="text-indigo-600">
                                                <FiUser />
                                            </span>
                                        </div>
                                        <span className="text-gray-700 font-medium">Admin</span>
                                    </div>
                                </label>
                            </motion.div>
                        </div>
                    </RadioGroupField>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-red-500 text-sm"
                        >
                            {(error as any)?.data?.message || "An error occurred"}
                        </motion.p>
                    )}
                    {successData && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-green-500 text-sm"
                        >
                            User created successfully!
                        </motion.p>
                    )}

                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? "Creating..." : "Create User"}
                        <span className="inline ml-2">
                            <FiChevronRight />
                        </span>
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default CreateUserPage;