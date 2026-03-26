"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ClientList } from '@/state';
import { useGetClientsQuery, useDeleteClientMutation } from '@/state/api';
import { Edit, Trash2, User, ImageOff } from 'lucide-react';

interface ClientTableProps {
    clients: ClientList[];
    onEdit: (client: ClientList) => void;
}

export default function ClientTable({ clients, onEdit }: ClientTableProps) {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const { data, isLoading, isError, error, refetch } = useGetClientsQuery({ page, limit });
    const [deleteClient, { isLoading: isDeleting }] = useDeleteClientMutation();

    useEffect(() => {
        refetch();
    }, [page, limit, refetch]);

    const handleDelete = async (id: number) => {
        try {
            await deleteClient(id).unwrap();
            toast.success('Client deleted successfully');
            if (data && data.clients.length === 1 && page > 1) {
                setPage((prev) => prev - 1);
            } else {
                refetch();
            }
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to delete client');
        }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3 text-gray-600">Loading clients...</span>
        </div>
    );

    if (isError) return (
        <div className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <p className="text-red-600 font-medium">Error loading clients</p>
            <p className="text-gray-500 text-sm mt-1">Please try again later</p>
        </div>
    );

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Container */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Client Logo
                        </th>
                        <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Client Name
                        </th>
                        <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Contact Email
                        </th>
                        <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {clients.map((client) => (
                        <tr
                            key={client.id}
                            className="hover:bg-gray-50 transition-colors duration-150"
                        >
                            {/* CLIENT LOGO - Separated Column */}
                            <td className="py-4 px-6">
                                <div className="flex justify-center">
                                    <div className="relative">
                                        {client.imageUrl ? (
                                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center p-1">
                                                <img
                                                    src={client.imageUrl}
                                                    alt={client.customClientName || 'Client logo'}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.parentElement!.querySelector('.fallback')?.classList.remove('hidden');
                                                    }}
                                                />
                                                <div className="hidden fallback w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <ImageOff className="w-5 h-5 text-gray-400" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                                                <User className="w-5 h-5 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>

                            {/* CLIENT NAME - Separated Column */}
                            <td className="py-4 px-6">
                                <div className="min-w-[200px]">
                                    <div className="font-medium text-gray-900">
                                        {client.clientName || client.customClientName || 'Unnamed Client'}
                                    </div>
                                    {client.clientName && client.customClientName && client.clientName !== client.customClientName && (
                                        <div className="text-sm text-gray-500 mt-1">
                                            {client.customClientName}
                                        </div>
                                    )}
                                </div>
                            </td>

                            {/* EMAIL */}
                            <td className="py-4 px-6">
                                <div className="flex items-center">
                                    {client.contactEmail ? (
                                        <>
                                            <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <a
                                                href={`mailto:${client.contactEmail}`}
                                                className="text-sm text-gray-700 hover:text-blue-600 hover:underline transition-colors"
                                            >
                                                {client.contactEmail}
                                            </a>
                                        </>
                                    ) : (
                                        <span className="text-sm text-gray-400 italic">No email</span>
                                    )}
                                </div>
                            </td>

                            {/* ACTIONS */}
                            <td className="py-4 px-6">
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onEdit(client)}
                                        className="flex items-center gap-2"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete(client.id)}
                                        disabled={isDeleting}
                                        className="flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {data && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                        <div className="text-sm text-gray-600">
                            Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(page * limit, data.total)}</span> of{' '}
                            <span className="font-medium">{data.total}</span> clients
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Rows per page:</span>
                                <select
                                    value={limit}
                                    onChange={(e) => {
                                        setLimit(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1.5"
                                >
                                    Previous
                                </Button>

                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: Math.min(3, data.totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (data.totalPages <= 3) {
                                            pageNum = i + 1;
                                        } else if (page === 1) {
                                            pageNum = i + 1;
                                        } else if (page === data.totalPages) {
                                            pageNum = data.totalPages - 2 + i;
                                        } else {
                                            pageNum = page - 1 + i;
                                        }

                                        if (pageNum > data.totalPages) return null;

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`px-3 py-1.5 text-sm rounded-md ${
                                                    page === pageNum
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((prev) => prev + 1)}
                                    disabled={page === data.totalPages}
                                    className="px-3 py-1.5"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}