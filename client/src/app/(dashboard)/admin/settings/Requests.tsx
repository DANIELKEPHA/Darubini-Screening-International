"use client";
import React from "react";
import { User, Mail, Phone, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGetAllUsersQuery } from "@/state";

const Requests = () => {
    const router = useRouter();
    const { data, isLoading, isError } = useGetAllUsersQuery();

    const users = data || [];

    const handleViewProfile = (cognitoId: string, userType: string) => {
        router.push(
            `/${userType.toLowerCase()}/settings/${cognitoId}`
        );
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">All Users</h1>

            {isLoading && <p>Loading users...</p>}
            {isError && <p className="text-red-500">Failed to load users</p>}

            <div className="bg-white rounded-xl shadow divide-y">
                {users.map((user: any) => (
                    <div
                        key={user.cognitoId}
                        onClick={() => handleViewProfile(user.cognitoId, user.userType)}
                        className="p-5 hover:bg-gray-50 cursor-pointer flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                            {user.profilePicture ? (
                                <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-6 h-6 m-3 text-gray-500" />
                            )}
                        </div>

                        <div className="flex-1">
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            {user.department && (
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                    <Building2 size={14} /> {user.department}
                                </p>
                            )}
                        </div>

                        <span className="text-xs px-3 py-1 rounded-full bg-gray-100">
                            {user.userType}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Requests;