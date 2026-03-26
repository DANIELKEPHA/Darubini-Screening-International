'use client';

import { useState, useMemo } from 'react';
import { AuditLog } from '@/state';
import { formatDateTime, formatEnumString } from '@/lib/utils';
import { ChevronDown, ChevronUp, SortAsc, SortDesc, Search } from 'lucide-react';

interface HistoryTabProps {
    auditLogs: AuditLog[];
    isLoading: boolean;
    error: any;
    showEntityId?: boolean;
}

type SortKey = 'action' | 'createdAt' | 'actor' | 'role' | 'entityId';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'table' | 'timeline';

export default function HistoryTab({ auditLogs, isLoading, error, showEntityId = false }: HistoryTabProps) {
    const [sortKey, setSortKey] = useState<SortKey>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [filterAction, setFilterAction] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('table');

    const toggleRowExpansion = (id: number) => {
        setExpandedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        );
    };

    const handleSort = (key: SortKey) => {
        if (key === sortKey) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    // Sort and filter audit logs
    const sortedAndFilteredAuditLogs = useMemo(() => {
        let result = [...auditLogs];

        // Filter by action and search term
        if (filterAction || searchTerm) {
            result = result.filter((log) => {
                const actionMatch = filterAction
                    ? log.action.toLowerCase().includes(filterAction.toLowerCase())
                    : true;
                const searchMatch = searchTerm
                    ? log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (log.actorUser?.name || log.actorAdmin?.name || log.actorAccounts?.name || log.actorStaff?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (log.meta?.expenseName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    log.entityId.toString().includes(searchTerm)
                    : true;
                return actionMatch && searchMatch;
            });
        }

        // Sort
        result.sort((a, b) => {
            const aValue = sortKey === 'actor'
                ? (a.actorUser?.name || a.actorAdmin?.name || a.actorAccounts?.name || a.actorStaff?.name || '')
                : sortKey === 'role'
                    ? (a.actorUser?.role || a.actorAdmin?.role || a.actorAccounts?.role || a.actorStaff?.role || '')
                    : sortKey === 'entityId'
                        ? a.entityId
                        : a[sortKey];
            const bValue = sortKey === 'actor'
                ? (b.actorUser?.name || b.actorAdmin?.name || b.actorAccounts?.name || b.actorStaff?.name || '')
                : sortKey === 'role'
                    ? (b.actorUser?.role || b.actorAdmin?.role || b.actorAccounts?.role || b.actorStaff?.role || '')
                    : sortKey === 'entityId'
                        ? b.entityId
                        : b[sortKey];

            if (sortKey === 'createdAt') {
                return sortOrder === 'asc'
                    ? new Date(aValue).getTime() - new Date(bValue).getTime()
                    : new Date(bValue).getTime() - new Date(aValue).getTime();
            }
            return sortOrder === 'asc'
                ? String(aValue).localeCompare(String(bValue))
                : String(bValue).localeCompare(String(aValue));
        });

        return result;
    }, [auditLogs, sortKey, sortOrder, filterAction, searchTerm]);

    // Get unique actions for filter dropdown
    const uniqueActions = useMemo(
        () => [...new Set(auditLogs.map((log) => log.action))].sort(),
        [auditLogs]
    );

    // Define badge styles for different action types
    const getActionBadgeClass = (action: string) => {
        switch (action) {
            case 'CREATE':
                return 'bg-green-100 text-green-800';
            case 'CREATE_DRAFT':
                return 'bg-blue-100 text-blue-800';
            case 'UPDATE':
                return 'bg-yellow-100 text-yellow-800';
            case 'DELETE':
                return 'bg-red-100 text-red-800';
            case 'APPROVE':
                return 'bg-purple-100 text-purple-800';
            case 'SEND_TO_ACCOUNTS':
                return 'bg-indigo-100 text-indigo-800';
            case 'DOWNLOAD_PDF':
                return 'bg-gray-100 text-gray-800';
            case 'REVERSE':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Render metadata for DELETE actions and others
    const renderMetadata = (meta: any) => {
        if (meta?.expenseDetails) {
            return (
                <div>
                    <h4 className="text-sm font-medium text-gray-700">Deleted Expense Details</h4>
                    <div className="mt-2 text-sm text-gray-600 bg-gray-100 p-3 rounded-md">
                        <p><strong>ID:</strong> {meta.expenseDetails.id}</p>
                        <p><strong>Reference Number:</strong> {meta.expenseDetails.referenceNumber || 'N/A'}</p>
                        <p><strong>Expense Name:</strong> {meta.expenseDetails.expenseName}</p>
                        <p><strong>Agent Name:</strong> {meta.expenseDetails.agentName}</p>
                        <p><strong>KRA PIN:</strong> {meta.expenseDetails.kraPin || 'N/A'}</p>
                        <p><strong>Date:</strong> {formatDateTime(meta.expenseDetails.date)}</p>
                        <p><strong>Details:</strong> {meta.expenseDetails.expenseDetails}</p>
                        <p><strong>Institution:</strong> {meta.expenseDetails.institutionName}</p>
                        <p><strong>Reason:</strong> {meta.expenseDetails.reasonForPayment}</p>
                        <p><strong>Frequency:</strong> {meta.expenseDetails.frequency}</p>
                        <p><strong>Payment Mode:</strong> {meta.expenseDetails.paymentMode}</p>
                        <p><strong>Payment Description:</strong> {meta.expenseDetails.paymentModeDescription}</p>
                        <p><strong>Amount:</strong> {meta.expenseDetails.currency} {meta.expenseDetails.amount}</p>
                        <p><strong>Total Paid:</strong> {meta.expenseDetails.currency} {meta.expenseDetails.totalAmountPaid}</p>
                        <p><strong>Payment Status:</strong> {meta.expenseDetails.paymentStatus}</p>
                        <p><strong>Expense Status:</strong> {meta.expenseDetails.expenseStatus}</p>
                        <p><strong>LPO Status:</strong> {meta.expenseDetails.lpoStatus || 'N/A'}</p>
                        <p><strong>Item Type:</strong> {meta.expenseDetails.itemType || 'N/A'}</p>
                        <p><strong>Account Type:</strong> {meta.expenseDetails.accountType || 'N/A'}</p>
                        <p><strong>Supplier:</strong> {meta.expenseDetails.supplier ? meta.expenseDetails.supplier.name : 'N/A'}</p>
                        <p><strong>Created By:</strong> {meta.expenseDetails.createdBy.name} ({meta.expenseDetails.createdBy.role})</p>
                        <p><strong>Approved By:</strong> {meta.expenseDetails.approvedBy.name || 'Not Approved'}</p>
                        <p><strong>Created At:</strong> {formatDateTime(meta.expenseDetails.createdAt)}</p>
                        <p><strong>Updated At:</strong> {formatDateTime(meta.expenseDetails.updatedAt)}</p>
                    </div>
                </div>
            );
        }
        return (
            <pre className="mt-2 text-sm text-gray-600 bg-gray-100 p-3 rounded-md overflow-auto">
                {JSON.stringify(meta, null, 2)}
            </pre>
        );
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">History</h3>
                <div className="flex space-x-3 items-center">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search actions, actor, expense, or ID..."
                            className="px-3 py-2 pl-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    </div>
                    <select
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                    >
                        <option value="">All Actions</option>
                        {uniqueActions.map((action) => (
                            <option key={action} value={action}>
                                {formatEnumString(action)}
                            </option>
                        ))}
                    </select>
                    <button
                        className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-purple-800"
                        onClick={() => setViewMode(viewMode === 'table' ? 'timeline' : 'table')}
                    >
                        {viewMode === 'table' ? 'Switch to Timeline' : 'Switch to Table'}
                    </button>
                </div>
            </div>
            {isLoading && (
                <div className="text-center text-gray-600">Loading history...</div>
            )}
            {error && (
                <div className="text-red-600 font-medium">
                    Error loading history: {(error as any)?.data?.message || 'Unknown error'}
                </div>
            )}
            {!isLoading && !error && sortedAndFilteredAuditLogs.length === 0 ? (
                <p className="text-gray-500">No history available</p>
            ) : viewMode === 'table' ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            {showEntityId && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        className="flex items-center space-x-1"
                                        onClick={() => handleSort('entityId')}
                                    >
                                        <span>Expense ID</span>
                                        {sortKey === 'entityId' && (sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />)}
                                    </button>
                                </th>
                            )}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <button
                                    className="flex items-center space-x-1"
                                    onClick={() => handleSort('action')}
                                >
                                    <span>Action</span>
                                    {sortKey === 'action' && (sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />)}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <button
                                    className="flex items-center space-x-1"
                                    onClick={() => handleSort('actor')}
                                >
                                    <span>Actor</span>
                                    {sortKey === 'actor' && (sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />)}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <button
                                    className="flex items-center space-x-1"
                                    onClick={() => handleSort('role')}
                                >
                                    <span>Role</span>
                                    {sortKey === 'role' && (sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />)}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <button
                                    className="flex items-center space-x-1"
                                    onClick={() => handleSort('createdAt')}
                                >
                                    <span>Timestamp</span>
                                    {sortKey === 'createdAt' && (sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />)}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Metadata
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {sortedAndFilteredAuditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                {showEntityId && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {log.entityId} ({log.meta?.expenseName || 'N/A'})
                                    </td>
                                )}
                                <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeClass(
                                                log.action
                                            )}`}
                                        >
                                            {formatEnumString(log.action)}
                                        </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {log.actorUser?.name ||
                                        log.actorAdmin?.name ||
                                        log.actorAccounts?.name ||
                                        log.actorStaff?.name ||
                                        'Unknown'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatEnumString(
                                        log.actorUser?.role ||
                                        log.actorAdmin?.role ||
                                        log.actorAccounts?.role ||
                                        log.actorStaff?.role ||
                                        'Unknown'
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDateTime(log.createdAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <button
                                        onClick={() => toggleRowExpansion(log.id)}
                                        className="text-purple-600 hover:text-purple-800 flex items-center"
                                    >
                                        {expandedRows.includes(log.id) ? (
                                            <>
                                                <ChevronUp size={16} className="mr-1" />
                                                Hide Details
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown size={16} className="mr-1" />
                                                Show Details
                                            </>
                                        )}
                                    </button>
                                    {expandedRows.includes(log.id) && (
                                        <div className="mt-2">{renderMetadata(log.meta)}</div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedAndFilteredAuditLogs.map((log) => (
                        <div
                            key={log.id}
                            className="relative pl-8 pb-8 border-l-2 border-gray-200 hover:border-purple-600"
                        >
                            <div className="absolute -left-2 top-0 w-4 h-4 bg-purple-600 rounded-full"></div>
                            <div className="bg-gray-50 p-4 rounded-md">
                                <div className="flex items-center justify-between">
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeClass(
                                            log.action
                                        )}`}
                                    >
                                        {formatEnumString(log.action)}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {formatDateTime(log.createdAt)}
                                    </span>
                                </div>
                                {showEntityId && (
                                    <p className="mt-2 text-sm text-gray-900">
                                        <strong>Expense ID:</strong> {log.entityId} ({log.meta?.expenseName || 'N/A'})
                                    </p>
                                )}
                                <p className="mt-2 text-sm text-gray-900">
                                    <strong>Actor:</strong>{' '}
                                    {log.actorUser?.name ||
                                        log.actorAdmin?.name ||
                                        log.actorAccounts?.name ||
                                        log.actorStaff?.name ||
                                        'Unknown'}{' '}
                                    ({formatEnumString(
                                    log.actorUser?.role ||
                                    log.actorAdmin?.role ||
                                    log.actorAccounts?.role ||
                                    log.actorStaff?.role ||
                                    'Unknown'
                                )})
                                </p>
                                <button
                                    onClick={() => toggleRowExpansion(log.id)}
                                    className="mt-2 text-purple-600 hover:text-purple-800 flex items-center text-sm"
                                >
                                    {expandedRows.includes(log.id) ? (
                                        <>
                                            <ChevronUp size={16} className="mr-1" />
                                            Hide Details
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown size={16} className="mr-1" />
                                            Show Details
                                        </>
                                    )}
                                </button>
                                {expandedRows.includes(log.id) && (
                                    <div className="mt-2">{renderMetadata(log.meta)}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}