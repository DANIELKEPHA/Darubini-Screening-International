'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { useGetUserLeaveDataQuery, useApproveLeaveRequestMutation, useRejectLeaveRequestMutation } from "@/state";
import { Calendar} from 'lucide-react';

interface Props {
    cognitoId: string;
}

const AdminUserLeaveManagement = ({ cognitoId }: Props) => {
    const { data, isLoading, error } = useGetUserLeaveDataQuery(cognitoId);

    const [approveLeave] = useApproveLeaveRequestMutation();
    const [rejectLeave] = useRejectLeaveRequestMutation();

    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [remarks, setRemarks] = useState('');

    const balance = data?.balance;
    const requests = data?.requests || [];

    const handleApprove = async (approvalId: number) => {
        if (!remarks.trim()) return alert("Please add remarks");

        await approveLeave({
            leaveRequestId: selectedRequest.id,
            approvalId,
            comments: remarks,
        });

        setRemarks('');
        setSelectedRequest(null);
    };

    const handleReject = async (approvalId: number) => {
        if (!remarks.trim()) return alert("Please add remarks");

        await rejectLeave({
            leaveRequestId: selectedRequest.id,
            approvalId,
            comments: remarks,
        });

        setRemarks('');
        setSelectedRequest(null);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading leave data...</div>;
    if (error) return <div className="p-8 text-red-500">Failed to load leave information</div>;

    return (
        <div className="p-6 space-y-8">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    {data?.user?.profilePicture ? (
                        <img
                            src={data.user.profilePicture}
                            alt="Profile"
                            className="w-20 h-20 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold">
                            {data?.user?.name?.charAt(0) ?? "U"}
                        </div>
                    )}

                    <div>
                        <h2 className="text-lg font-semibold">
                            {data?.user?.name}
                        </h2>
                        <p className="text-sm text-gray-600">
                            {data?.user?.email}
                        </p>
                    </div>
                </div>
            </div>

            {/* Leave Balance Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {balance ? (
                    <>
                        <div className="bg-white p-6 rounded-2xl shadow-sm">
                            <p className="text-sm text-gray-500">Annual Leave</p>
                            <p className="text-4xl font-bold mt-2">{balance.annualRemaining} <span className="text-lg">days</span></p>
                            <p className="text-xs text-gray-500 mt-1">Used: {balance.annualUsed}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm">
                            <p className="text-sm text-gray-500">Sick Leave</p>
                            <p className="text-4xl font-bold mt-2">{balance.sickRemaining} <span className="text-lg">days</span></p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm">
                            <p className="text-sm text-gray-500">Compassionate</p>
                            <p className="text-4xl font-bold mt-2">{balance.compassionateRemaining} <span className="text-lg">days</span></p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm">
                            <p className="text-sm text-gray-500">Emergency</p>
                            <p className="text-4xl font-bold mt-2">{balance.emergencyRemaining} <span className="text-lg">days</span></p>
                        </div>
                    </>
                ) : (
                    <div className="col-span-4 bg-white p-8 rounded-2xl text-center">
                        No leave balance record found for this user.
                    </div>
                )}
            </div>

            {/* Leave Requests History */}
            <div className="bg-white rounded-2xl shadow-sm">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold">Leave Request History</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="bg-gray-50">
                            <th className="px-6 py-4 text-left">Type</th>
                            <th className="px-6 py-4 text-left">Period</th>
                            <th className="px-6 py-4 text-left">Days</th>
                            <th className="px-6 py-4 text-left">Status</th>
                            <th className="px-6 py-4 text-left">Requested</th>
                            <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y">
                        {requests.map((req: any) => (
                            <tr key={req.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-medium">{req.leaveType.replace(/_/g, ' ')}</div>
                                    {req.otherLeaveType && <div className="text-sm text-gray-500">{req.otherLeaveType}</div>}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {format(new Date(req.startDate), 'dd MMM yyyy')} — {format(new Date(req.endDate), 'dd MMM yyyy')}
                                </td>
                                <td className="px-6 py-4 font-semibold">{req.daysRequested}</td>
                                <td className="px-6 py-4">
                    <span className={`px-4 py-1 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {format(new Date(req.createdAt), 'dd MMM yyyy')}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {req.status === 'PENDING' && (
                                        <button
                                            onClick={() => setSelectedRequest(req)}
                                            className="text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Review
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-lg">
                        <div className="p-6 border-b">
                            <h3 className="font-semibold">Review Leave Request</h3>
                        </div>

                        <div className="p-6 space-y-4">
              <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add your remarks here..."
                  className="w-full h-32 border rounded-xl p-4"
              />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleApprove(selectedRequest.id)}
                                    className="flex-1 bg-green-600 text-white py-3 rounded-xl font-medium"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleReject(selectedRequest.id)}
                                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-medium"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUserLeaveManagement;