'use client';

import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useGetMyLeaveRequestsQuery, useGetLeaveBalanceQuery } from '@/state';
import LeaveRequestModal from '@/app/(dashboard)/staff/settings/components/leave/LeaveRequestModal';

const MyLeaveRequests = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState('ALL');

    const { data: requestsData, isLoading: requestsLoading, error: requestsError } =
        useGetMyLeaveRequestsQuery({
            status: filterStatus === 'ALL' ? undefined : filterStatus,
        });

    const { data: balance, isLoading: balanceLoading, error: balanceError } =
        useGetLeaveBalanceQuery();

    const requests = requestsData?.data ?? [];

    const filteredRequests = useMemo(() => {
        return requests.filter(
            (req: any) => filterStatus === 'ALL' || req.status === filterStatus
        );
    }, [requests, filterStatus]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'REJECTED':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const balanceItems = [
        {
            label: 'Annual Leave',
            entitled: Number(balance?.annualEntitled ?? 0),
            used: Number(balance?.annualUsed ?? 0),
            remaining: Number(balance?.annualRemaining ?? 0),
            color: 'blue',
        },
        {
            label: 'Sick Leave',
            entitled: Number(balance?.sickEntitled ?? 0),
            used: Number(balance?.sickUsed ?? 0),
            remaining: Number(balance?.sickRemaining ?? 0),
            color: 'emerald',
        },
        {
            label: 'Emergency Leave',
            entitled: Number(balance?.emergencyEntitled ?? 0),
            used: Number(balance?.emergencyUsed ?? 0),
            remaining: Number(balance?.emergencyRemaining ?? 0),
            color: 'orange',
        },
        {
            label: 'Maternity Leave',
            entitled: Number(balance?.maternityEntitled ?? 0),
            used: Number(balance?.maternityUsed ?? 0),
            remaining: Number(balance?.maternityRemaining ?? 0),
            color: 'pink',
        },
        {
            label: 'Paternity Leave',
            entitled: Number(balance?.paternityEntitled ?? 0),
            used: Number(balance?.paternityUsed ?? 0),
            remaining: Number(balance?.paternityRemaining ?? 0),
            color: 'purple',
        },
        {
            label: 'Compassionate Leave',
            entitled: Number(balance?.compassionateEntitled ?? 0),
            used: Number(balance?.compassionateUsed ?? 0),
            remaining: Number(balance?.compassionateRemaining ?? 0),
            color: 'indigo',
        },
    ];

    const getColorClass = (color: string, type: 'text' | 'bg' = 'text') => {
        const colors: any = {
            blue: { text: 'text-blue-600', bg: 'bg-blue-100' },
            emerald: { text: 'text-emerald-600', bg: 'bg-emerald-100' },
            purple: { text: 'text-purple-600', bg: 'bg-purple-100' },
            orange: { text: 'text-orange-600', bg: 'bg-orange-100' },
            pink: { text: 'text-pink-600', bg: 'bg-pink-100' },
            indigo: { text: 'text-indigo-600', bg: 'bg-indigo-100' },
        };
        return type === 'text'
            ? colors[color]?.text
            : colors[color]?.bg;
    };

    if (requestsError) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <p className="text-red-600 font-medium">Failed to load leave requests.</p>
                    <p className="text-gray-500 mt-2">Please refresh and try again.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Leave Requests</h1>
                    <p className="text-gray-600 mt-1">Track your leave applications and balances</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition shadow-sm"
                >
                    + New Leave Request
                </button>
            </div>

            {/* Balance Error */}
            {balanceError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-700">Unable to load leave balance.</p>
                </div>
            )}

            {/* Compact Leave Balance Cards - Takes ~35% of top space */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {balanceLoading
                    ? Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-pulse h-[172px]"
                        />
                    ))
                    : balanceItems.map((item) => (
                        <div
                            key={item.label}
                            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col"
                        >
                            <h3 className="font-semibold text-gray-800 text-[15px] mb-3">
                                {item.label}
                            </h3>

                            <div className="space-y-2.5 flex-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Entitled</span>
                                    <span className="font-medium">{item.entitled} days</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Used</span>
                                    <span className="font-medium text-gray-700">{item.used} days</span>
                                </div>

                                <div className="pt-3 border-t border-gray-100">
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-medium text-gray-700">Remaining</span>
                                        <span className={`text-2xl font-bold ${getColorClass(item.color)}`}>
                        {item.remaining}
                      </span>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className={`${getColorClass(item.color, 'bg')} h-1.5 rounded-full transition-all duration-500`}
                                        style={{
                                            width: item.entitled > 0 ? `${Math.min((item.used / item.entitled) * 100, 100)}%` : '0%',
                                        }}
                                    />
                                </div>
                            </div>

                        </div>
                    ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                    {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
                                filterStatus === status
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <p className="text-sm text-gray-500">
                    Showing {filteredRequests.length} of {requests.length} requests
                </p>
            </div>

            {/* Leave Requests List */}
            <div className="space-y-4">
                {requestsLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="bg-white p-6 rounded-2xl shadow-sm animate-pulse h-40" />
                    ))
                ) : filteredRequests.length > 0 ? (
                    filteredRequests.map((req: any) => {
                        const latestApproval = req.approvals?.length > 0 ? req.approvals[req.approvals.length - 1] : null;

                        return (
                            <div
                                key={req.id}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-gray-200 transition-all"
                            >
                                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                    <div className="flex items-center gap-3">
                    <span
                        className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(
                            req.status
                        )}`}
                    >
                      {req.status}
                    </span>
                                        <div>
                                            <p className="font-semibold text-lg text-gray-900">
                                                {req.leaveType?.replace(/_/g, ' ')}
                                            </p>
                                            {req.otherLeaveType && (
                                                <p className="text-sm text-gray-500">{req.otherLeaveType}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {format(new Date(req.createdAt), 'dd MMM yyyy')}
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-gray-500">Period</p>
                                        <p className="font-medium mt-1">
                                            {format(new Date(req.startDate), 'dd MMM yyyy')} -{' '}
                                            {format(new Date(req.endDate), 'dd MMM yyyy')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-gray-500">Days Requested</p>
                                        <p className="text-2xl font-bold mt-1">{req.daysRequested}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-gray-500">Requested On</p>
                                        <p className="font-medium mt-1">
                                            {format(new Date(req.createdAt), 'EEEE, dd MMM yyyy')}
                                        </p>
                                    </div>
                                </div>

                                {req.reason && (
                                    <div className="mt-5 p-5 bg-gray-50 rounded-xl border-l-4 border-gray-300">
                                        <p className="italic text-gray-700">&#34;{req.reason}&#34;</p>
                                    </div>
                                )}

                                {latestApproval?.comments && (
                                    <div className="mt-5 p-5 bg-blue-50 rounded-xl border border-blue-100">
                                        <p className="text-xs font-semibold text-blue-700 mb-2">ADMIN REMARK</p>
                                        <p className="text-gray-700">{latestApproval.comments}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                        <p className="text-xl text-gray-500">No leave requests found</p>
                        <p className="text-gray-400 mt-2">Start by submitting your first leave request.</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium"
                        >
                            Request Leave
                        </button>
                    </div>
                )}
            </div>

            <LeaveRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};

export default MyLeaveRequests;