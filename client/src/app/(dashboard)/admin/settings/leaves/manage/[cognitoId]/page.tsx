'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import AdminUserLeaveManagement from "@/app/(dashboard)/admin/settings/leaves/AdminUserLeaveManagement";

const UserLeaveManagementPage = () => {
    const params = useParams();

    return (
        <div>
            <AdminUserLeaveManagement
                cognitoId={params?.cognitoId as string}
            />
        </div>
    );
};

export default UserLeaveManagementPage;