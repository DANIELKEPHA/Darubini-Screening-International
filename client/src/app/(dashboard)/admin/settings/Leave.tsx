'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import {
    useGetLeaveRequestsQuery,
    useApproveLeaveRequestMutation,
    useRejectLeaveRequestMutation,
    useGetLeaveBalanceQuery
} from "@/state";
import { Search, Eye } from 'lucide-react';

const AdminLeaveManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');

    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [remarks, setRemarks] = useState('');

    const { data: requestsData, isLoading } = useGetLeaveRequestsQuery({});
    const { data: summary } = useGetLeaveBalanceQuery();

    const [approveLeave, { isLoading: approving }] = useApproveLeaveRequestMutation();
    const [rejectLeave, { isLoading: rejecting }] = useRejectLeaveRequestMutation();

    const requests = requestsData?.data || [];

    const filteredRequests = requests
        .filter((req: any) => {
            const employee =
                req.adminRequester?.name ||
                req.accountsRequester?.name ||
                req.staffRequester?.name ||
                '';

            const matchesSearch =
                employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (req.reason || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
            const matchesType = typeFilter === 'ALL' || req.leaveType === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        })
        .sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

    const handleApprove = async (request: any) => {
        if (!remarks.trim()) return;

        await approveLeave({
            leaveRequestId: request.id,
            approvalId: request.approvals?.[0]?.id, // IMPORTANT: backend expects this
            comments: remarks
        });

        setRemarks('');
        setSelectedRequest(null);
    };

    const handleReject = async (request: any) => {
        if (!remarks.trim()) return;

        await rejectLeave({
            leaveRequestId: request.id,
            approvalId: request.approvals?.[0]?.id,
            comments: remarks
        });

        setRemarks('');
        setSelectedRequest(null);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-700';
            case 'REJECTED': return 'bg-red-100 text-red-700';
            case 'PENDING': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-8">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Leave Management</h1>
                <p className="text-gray-600">Approve or reject employee leave requests</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-xl border">
                    <p>Total</p>
                    <h2 className="text-2xl font-bold">{requests.length}</h2>
                </div>

                <div className="p-4 bg-white rounded-xl border">
                    <p>Pending</p>
                    <h2 className="text-2xl font-bold text-yellow-600">
                        {requests.filter((r: any) => r.status === 'PENDING').length}
                    </h2>
                </div>

                <div className="p-4 bg-white rounded-xl border">
                    <p>Approved</p>
                    <h2 className="text-2xl font-bold text-green-600">
                        {requests.filter((r: any) => r.status === 'APPROVED').length}
                    </h2>
                </div>

                <div className="p-4 bg-white rounded-xl border">
                    <p>Rejected</p>
                    <h2 className="text-2xl font-bold text-red-600">
                        {requests.filter((r: any) => r.status === 'REJECTED').length}
                    </h2>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 bg-white p-4 rounded-xl border">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                        className="w-full pl-10 p-2 border rounded-lg"
                        placeholder="Search employee or reason..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border p-2 rounded-lg">
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>

                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border p-2 rounded-lg">
                    <option value="ALL">All Types</option>
                    <option value="ANNUAL">Annual</option>
                    <option value="SICK">Sick</option>
                    <option value="EMERGENCY">Emergency</option>
                    <option value="COMPASSIONATE">Compassionate</option>
                    <option value="OFF_DAY">Off Day</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="p-3 text-left">Employee</th>
                        <th>Type</th>
                        <th>Period</th>
                        <th>Days</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                    </thead>

                    <tbody>
                    {isLoading ? (
                        <tr><td colSpan={6} className="p-6 text-center">Loading...</td></tr>
                    ) : filteredRequests.length === 0 ? (
                        <tr><td colSpan={6} className="p-6 text-center">No requests</td></tr>
                    ) : (
                        filteredRequests.map((req: any) => {
                            const employee =
                                req.adminRequester ||
                                req.accountsRequester ||
                                req.staffRequester;

                            return (
                                <tr key={req.id} className="border-t">
                                    <td className="p-3">{employee?.name}</td>

                                    <td>{req.leaveType.replace(/_/g, ' ')}</td>

                                    <td>
                                        {format(new Date(req.startDate), 'dd MMM')} -
                                        {format(new Date(req.endDate), 'dd MMM')}
                                    </td>

                                    <td>{req.daysRequested}</td>

                                    <td>
                                        <span className={`px-2 py-1 rounded ${getStatusColor(req.status)}`}>
                                            {req.status}
                                        </span>
                                    </td>

                                    <td className="flex gap-2 p-2">
                                        <button
                                            onClick={() => setSelectedRequest(req)}
                                            className="p-2 border rounded"
                                        >
                                            <Eye size={16} />
                                        </button>

                                        {req.status === 'PENDING' && (
                                            <button
                                                onClick={() => setSelectedRequest(req)}
                                                className="px-3 py-1 bg-blue-600 text-white rounded"
                                            >
                                                Review
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-xl rounded-xl p-6">
                        <h2 className="text-xl font-bold mb-4">Leave Details</h2>

                        <p><b>Employee:</b> {
                            selectedRequest.adminRequester?.name ||
                            selectedRequest.accountsRequester?.name ||
                            selectedRequest.staffRequester?.name
                        }</p>

                        <p><b>Type:</b> {selectedRequest.leaveType}</p>
                        <p><b>Days:</b> {selectedRequest.daysRequested}</p>

                        <p className="mt-3"><b>Reason:</b></p>
                        <p className="text-gray-600">{selectedRequest.reason}</p>

                        {selectedRequest.status === 'PENDING' && (
                            <div className="mt-4">
                                <textarea
                                    className="w-full border p-2 rounded"
                                    placeholder="Remarks..."
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                />

                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => handleApprove(selectedRequest)}
                                        disabled={approving}
                                        className="bg-green-600 text-white px-4 py-2 rounded w-full"
                                    >
                                        Approve
                                    </button>

                                    <button
                                        onClick={() => handleReject(selectedRequest)}
                                        disabled={rejecting}
                                        className="bg-red-600 text-white px-4 py-2 rounded w-full"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setSelectedRequest(null)}
                            className="mt-4 w-full border p-2 rounded"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLeaveManagement;