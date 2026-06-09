'use client';

import React from "react";
import { User, Mail, Phone, Building2, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGetAllUsersQuery } from "@/state";

const Requests = () => {
    const router = useRouter();
    const { data: users = [], isLoading, isError } = useGetAllUsersQuery();

    const handleViewProfile = (cognitoId: string, userType: string) => {
        router.push(`/${userType.toLowerCase()}/settings/${cognitoId}`);
    };

    const handleManageLeave = (cognitoId: string, userType: string) => {
        // Navigate to dedicated leave management for this user
        router.push(`/admin/settings/leaves/manage/${cognitoId}`);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">All Users</h1>
                <p className="text-gray-500">Click on a user to manage their profile or leaves</p>
            </div>

            {isLoading && <p className="text-center py-8">Loading users...</p>}
            {isError && <p className="text-red-500 text-center py-8">Failed to load users</p>}

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 text-left">Employee</th>
                            <th className="px-6 py-4 text-left">Contact</th>
                            <th className="px-6 py-4 text-left">Department</th>
                            <th className="px-6 py-4 text-left">Role</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y">
                        {users.map((user: any) => (
                            <tr key={user.cognitoId} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                            {user.profilePicture ? (
                                                <img
                                                    src={user.profilePicture}
                                                    alt={user.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className="w-6 h-6 m-2 text-gray-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{user.name}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {user.phoneNumber && (
                                        <div className="flex items-center gap-1">
                                            <Phone size={16} /> {user.phoneNumber}
                                        </div>
                                    )}
                                </td>

                                <td className="px-6 py-4">
                                    {user.department ? (
                                        <div className="flex items-center gap-1 text-sm">
                                            <Building2 size={16} className="text-gray-400" />
                                            {user.department}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-sm">—</span>
                                    )}
                                </td>

                                <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 rounded-full">
                      {user.userType}
                    </span>
                                </td>

                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center gap-3">
                                        {/* View Profile Button */}
                                        <button
                                            onClick={() => handleViewProfile(user.cognitoId, user.userType)}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        >
                                            <User size={18} />
                                            Profile
                                        </button>

                                        {/* Manage Leave Button */}
                                        <button
                                            onClick={() => handleManageLeave(user.cognitoId, user.userType)}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition border border-emerald-200"
                                        >
                                            <Calendar size={18} />
                                            Manage Leave
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {users.length === 0 && !isLoading && (
                <p className="text-center text-gray-500 py-12">No users found.</p>
            )}
        </div>
    );
};

export default Requests;