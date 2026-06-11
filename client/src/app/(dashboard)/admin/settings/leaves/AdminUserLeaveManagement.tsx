'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useGetUserLeaveDataQuery, useApproveLeaveRequestMutation, useRejectLeaveRequestMutation } from "@/state";
import {
    Calendar, CheckCircle, XCircle, Clock, AlertCircle,
    Mail, ArrowLeft, TrendingUp, TrendingDown, Minus
} from 'lucide-react';

interface Props {
    cognitoId: string;
}

const AdminUserLeaveManagement = ({ cognitoId }: Props) => {
    const router = useRouter();

    const { data, isLoading, error } = useGetUserLeaveDataQuery(cognitoId);

    const [approveLeave] = useApproveLeaveRequestMutation();
    const [rejectLeave] = useRejectLeaveRequestMutation();

    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [remarks, setRemarks] = useState('');
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const balance = data?.balance;
    const requests = data?.requests || [];

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleApprove = async () => {
        if (!remarks.trim()) {
            setMessage({ type: 'error', text: "Please add remarks before approving." });
            return;
        }
        if (!selectedRequest) return;

        setIsApproving(true);
        try {
            await approveLeave({
                leaveRequestId: selectedRequest.id,
                comments: remarks,
            }).unwrap();

            setMessage({ type: 'success', text: "Leave request approved successfully!" });
            setRemarks('');
            setSelectedRequest(null);
        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err?.data?.message || "Failed to approve leave request."
            });
        } finally {
            setIsApproving(false);
        }
    };

    const handleReject = async () => {
        if (!remarks.trim()) {
            setMessage({ type: 'error', text: "Please add remarks before rejecting." });
            return;
        }
        if (!selectedRequest) return;

        setIsRejecting(true);
        try {
            await rejectLeave({
                leaveRequestId: selectedRequest.id,
                comments: remarks,
            }).unwrap();

            setMessage({ type: 'success', text: "Leave request rejected successfully." });
            setRemarks('');
            setSelectedRequest(null);
        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err?.data?.message || "Failed to reject leave request."
            });
        } finally {
            setIsRejecting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle className="w-4 h-4" />;
            case 'REJECTED': return <XCircle className="w-4 h-4" />;
            case 'PENDING': return <Clock className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    const getTrendIcon = (remaining: number, entitled: number) => {
        const percentage = entitled > 0 ? (remaining / entitled) * 100 : 0;
        if (percentage < 20) return <TrendingDown className="w-4 h-4 text-red-500" />;
        if (percentage > 70) return <TrendingUp className="w-4 h-4 text-green-500" />;
        return <Minus className="w-4 h-4 text-yellow-500" />;
    };

    const isLocked = balance?.isLocked ?? false;

    const balanceCards = [
        { title: "Annual Leave", remaining: balance?.annualRemaining ?? 0, used: balance?.annualUsed ?? 0, entitled: balance?.annualEntitled ?? 20, color: "from-blue-500 to-blue-600", bgLight: "bg-blue-50", icon: "🏖️" },
        { title: "Sick Leave", remaining: balance?.sickRemaining ?? 0, used: balance?.sickUsed ?? 0, entitled: balance?.sickEntitled ?? 15, color: "from-green-500 to-green-600", bgLight: "bg-green-50", icon: "🤒" },
        { title: "Compassionate Leave", remaining: balance?.compassionateRemaining ?? 0, used: balance?.compassionateUsed ?? 0, entitled: balance?.compassionateEntitled ?? 5, color: "from-purple-500 to-purple-600", bgLight: "bg-purple-50", icon: "💝" },
        { title: "Emergency Leave", remaining: balance?.emergencyRemaining ?? 0, used: balance?.emergencyUsed ?? 0, entitled: balance?.emergencyEntitled ?? 3, color: "from-red-500 to-red-600", bgLight: "bg-red-50", icon: "🚨" }
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading leave data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
                    <div className="flex items-center gap-3 text-red-600">
                        <AlertCircle className="w-6 h-6" />
                        <p className="font-medium">Failed to load leave information</p>
                    </div>
                    <p className="text-red-500 text-sm mt-2">Please refresh the page or contact support.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6">

                {/* Back Button - Goes to Admin Settings (Requests Tab) */}
                <button
                    onClick={() => router.push('/admin/settings')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="font-medium">Back to Requests</span>
                </button>

                {/* User Profile Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {data?.user?.profilePicture ? (
                                <img
                                    src={data.user.profilePicture}
                                    alt="Profile"
                                    className="w-16 h-16 rounded-full object-cover ring-4 ring-blue-100"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                    {data?.user?.name?.charAt(0) ?? "U"}
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">{data?.user?.name}</h1>
                                <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                                    <Mail className="w-4 h-4" />
                                    <span>{data?.user?.email}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isLocked && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <span>This user&apos;s leave balance is currently locked and cannot be modified.</span>
                        </div>
                    )}
                </div>

                {/* Message Toast */}
                {message && (
                    <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm border ${
                        message.type === 'success'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <p>{message.text}</p>
                    </div>
                )}

                {/* Leave Balance Overview */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">Leave Balance Overview</h2>
                        <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            Year: {balance?.year ?? new Date().getFullYear()} |
                            Last updated: {balance?.lastUpdatedAt ? format(new Date(balance.lastUpdatedAt), 'dd MMM yyyy') : 'N/A'}
                        </div>
                    </div>

                    {balance ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {balanceCards.map((card, idx) => (
                                <div key={idx} className={`${card.bgLight} rounded-xl p-6 transition-all hover:shadow-md border border-gray-100`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-3xl">{card.icon}</span>
                                        {getTrendIcon(card.remaining, card.entitled)}
                                    </div>
                                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                                    <p className="text-3xl font-bold mt-2 text-gray-800">
                                        {card.remaining} <span className="text-sm font-normal text-gray-500">days left</span>
                                    </p>
                                    <div className="mt-4 pt-3 border-t border-gray-200">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-600">Used: <span className="font-semibold">{card.used}</span></span>
                                            <span className="text-gray-600">Entitled: <span className="font-semibold">{card.entitled}</span></span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`bg-gradient-to-r ${card.color} rounded-full h-2`}
                                                style={{ width: `${(card.used / card.entitled) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-12 rounded-2xl text-center border border-gray-200">
                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500">No leave balance record found.</p>
                        </div>
                    )}
                </div>

                {/* Leave Requests History */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">Leave Request History</h2>
                                <p className="text-sm text-gray-500 mt-1">Manage and review all leave requests</p>
                            </div>
                            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                {requests.length} Request{requests.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>

                    {requests.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Type</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Period</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Days</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Requested</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Action</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {requests.map((req: any) => (
                                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-800">
                                                {req.leaveType?.replace(/_/g, ' ') || 'Unknown'}
                                            </div>
                                            {req.otherLeaveType && <div className="text-xs text-gray-500 mt-0.5">{req.otherLeaveType}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {format(new Date(req.startDate), 'dd MMM yyyy')} — {format(new Date(req.endDate), 'dd MMM yyyy')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-gray-800">{req.daysRequested}</span>
                                            <span className="text-xs text-gray-500 ml-1">day{req.daysRequested !== 1 ? 's' : ''}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                {getStatusIcon(req.status)}
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                                                        {req.status}
                                                    </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {format(new Date(req.createdAt), 'dd MMM yyyy')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {req.status === 'PENDING' ? (
                                                <button
                                                    onClick={() => setSelectedRequest(req)}
                                                    disabled={isLocked}
                                                    className="px-4 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium disabled:opacity-50"
                                                >
                                                    Review
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500">No leave requests found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-semibold">Review Leave Request</h3>
                            <p className="text-sm text-gray-500 mt-1">Provide your decision with comments</p>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Leave Type:</span>
                                    <span className="font-medium">{selectedRequest.leaveType?.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Duration:</span>
                                    <span className="font-medium">{selectedRequest.daysRequested} day{selectedRequest.daysRequested !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Period:</span>
                                    <span className="font-medium">
                                        {format(new Date(selectedRequest.startDate), 'dd MMM')} — {format(new Date(selectedRequest.endDate), 'dd MMM yyyy')}
                                    </span>
                                </div>
                                {selectedRequest.reason && (
                                    <div className="pt-2 border-t border-gray-200">
                                        <p className="text-gray-500 mb-1">Reason:</p>
                                        <p className="text-gray-700">{selectedRequest.reason}</p>
                                    </div>
                                )}
                            </div>

                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Add your remarks/decision notes here..."
                                className="w-full h-32 border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 resize-none"
                            />

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleApprove}
                                    disabled={isApproving || isLocked}
                                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                                >
                                    {isApproving ? "Processing..." : (
                                        <> <CheckCircle className="w-5 h-5" /> Approve </>
                                    )}
                                </button>

                                <button
                                    onClick={handleReject}
                                    disabled={isRejecting || isLocked}
                                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                                >
                                    {isRejecting ? "Processing..." : (
                                        <> <XCircle className="w-5 h-5" /> Reject </>
                                    )}
                                </button>
                            </div>

                            <button
                                onClick={() => {
                                    setSelectedRequest(null);
                                    setRemarks('');
                                }}
                                className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUserLeaveManagement;