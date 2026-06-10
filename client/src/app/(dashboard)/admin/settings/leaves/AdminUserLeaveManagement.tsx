'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { useGetUserLeaveDataQuery, useApproveLeaveRequestMutation, useRejectLeaveRequestMutation } from "@/state";
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, User, Mail, Briefcase, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle className="w-4 h-4" />;
            case 'REJECTED': return <XCircle className="w-4 h-4" />;
            case 'PENDING': return <Clock className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    // Helper to get remaining days with trend
    const getTrendIcon = (remaining: number, entitled: number) => {
        const percentage = (remaining / entitled) * 100;
        if (percentage < 20) return <TrendingDown className="w-4 h-4 text-red-500" />;
        if (percentage > 70) return <TrendingUp className="w-4 h-4 text-green-500" />;
        return <Minus className="w-4 h-4 text-yellow-500" />;
    };

    if (isLoading) return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading leave data...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
                <div className="flex items-center gap-3 text-red-600">
                    <AlertCircle className="w-6 h-6" />
                    <p className="font-medium">Failed to load leave information</p>
                </div>
                <p className="text-red-500 text-sm mt-2">Please refresh the page or contact support if the issue persists.</p>
            </div>
        </div>
    );

    // Prepare balance cards data with only the properties that exist in LeaveBalance
    const balanceCards = [
        {
            title: "Annual Leave",
            remaining: balance?.annualRemaining ?? 0,
            used: balance?.annualUsed ?? 0,
            entitled: balance?.annualEntitled ?? 20,
            color: "from-blue-500 to-blue-600",
            bgLight: "bg-blue-50",
            icon: "🏖️"
        },
        {
            title: "Sick Leave",
            remaining: balance?.sickRemaining ?? 0,
            used: balance?.sickUsed ?? 0,
            entitled: balance?.sickEntitled ?? 15,
            color: "from-green-500 to-green-600",
            bgLight: "bg-green-50",
            icon: "🤒"
        },
        {
            title: "Compassionate Leave",
            remaining: balance?.compassionateRemaining ?? 0,
            used: balance?.compassionateUsed ?? 0,
            entitled: balance?.compassionateEntitled ?? 5,
            color: "from-purple-500 to-purple-600",
            bgLight: "bg-purple-50",
            icon: "💝"
        },
        {
            title: "Emergency Leave",
            remaining: balance?.emergencyRemaining ?? 0,
            used: balance?.emergencyUsed ?? 0,
            entitled: balance?.emergencyEntitled ?? 3,
            color: "from-red-500 to-red-600",
            bgLight: "bg-red-50",
            icon: "🚨"
        }
    ];

    // Calculate overall statistics
    const totalRemaining = balanceCards.reduce((sum, card) => sum + card.remaining, 0);
    const totalUsed = balanceCards.reduce((sum, card) => sum + card.used, 0);
    const totalEntitled = balanceCards.reduce((sum, card) => sum + card.entitled, 0);
    const utilizationRate = totalEntitled > 0 ? ((totalUsed / totalEntitled) * 100).toFixed(1) : 0;

    // Check if balance is locked
    const isLocked = balance?.isLocked ?? false;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Main Container - Full width with proper padding */}
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6">

                {/* Header Section with User Profile - Full width */}
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
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                    {data?.user?.name?.charAt(0) ?? "U"}
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                    {data?.user?.name}
                                </h1>
                                <div className="flex items-center gap-4 mt-1">
                                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                                        <Mail className="w-4 h-4" />
                                        <span>{data?.user?.email}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Lock Status Badge */}
                    {isLocked && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <span>This user&#39;s leave balance is currently locked and cannot be modified.</span>
                        </div>
                    )}
                </div>

                {/* Leave Balance Overview - Grid with all cards */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">Leave Balance Overview</h2>
                        <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            Year: {balance?.year ?? new Date().getFullYear()} | Last updated: {balance?.lastUpdatedAt ? format(new Date(balance.lastUpdatedAt), 'dd MMM yyyy') : 'N/A'}
                        </div>
                    </div>

                    {balance ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {balanceCards.map((card, idx) => (
                                <div key={idx} className={`${card.bgLight} rounded-xl p-6 transition-all duration-200 hover:shadow-md border border-gray-100`}>
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
                                            <span className="text-gray-600">Total: <span className="font-semibold">{card.entitled}</span></span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`bg-gradient-to-r ${card.color} rounded-full h-2 transition-all duration-500`}
                                                style={{ width: `${(card.used / card.entitled) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-12 rounded-2xl text-center border border-gray-200">
                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500">No leave balance record found for this user.</p>
                            <p className="text-sm text-gray-400 mt-1">Please ensure the user has been assigned leave entitlements for the current year.</p>
                        </div>
                    )}
                </div>

                {/* Leave Requests History - Full width table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">Leave Request History</h2>
                                <p className="text-sm text-gray-500 mt-1">Manage and review all leave requests</p>
                            </div>
                            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                {requests.length} Total {requests.length === 1 ? 'Request' : 'Requests'}
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
                                            {req.otherLeaveType && (
                                                <div className="text-xs text-gray-500 mt-0.5">{req.otherLeaveType}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span>
                                                        {format(new Date(req.startDate), 'dd MMM yyyy')} — {format(new Date(req.endDate), 'dd MMM yyyy')}
                                                    </span>
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
                                            {req.status === 'PENDING' && (
                                                <button
                                                    onClick={() => setSelectedRequest(req)}
                                                    className="px-4 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Review Request
                                                </button>
                                            )}
                                            {req.status !== 'PENDING' && (
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
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                                <Calendar className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500">No leave requests found</p>
                            <p className="text-sm text-gray-400 mt-1">This user hasn&#39;t submitted any leave requests yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Review Modal - Improved design */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-semibold text-gray-800">Review Leave Request</h3>
                            <p className="text-sm text-gray-500 mt-1">Provide your decision with comments</p>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Request Summary */}
                            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Leave Type:</span>
                                    <span className="font-medium text-gray-800">{selectedRequest.leaveType?.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Duration:</span>
                                    <span className="font-medium text-gray-800">{selectedRequest.daysRequested} day{selectedRequest.daysRequested !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Period:</span>
                                    <span className="font-medium text-gray-800">
                                        {format(new Date(selectedRequest.startDate), 'dd MMM')} - {format(new Date(selectedRequest.endDate), 'dd MMM yyyy')}
                                    </span>
                                </div>
                                {selectedRequest.reason && (
                                    <div className="pt-2 mt-2 border-t border-gray-200">
                                        <p className="text-xs text-gray-500 mb-1">Reason provided:</p>
                                        <p className="text-sm text-gray-700">{selectedRequest.reason}</p>
                                    </div>
                                )}
                            </div>

                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Add your remarks/decision notes here..."
                                className="w-full h-32 border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => handleApprove(selectedRequest.id)}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleReject(selectedRequest.id)}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <XCircle className="w-5 h-5" />
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