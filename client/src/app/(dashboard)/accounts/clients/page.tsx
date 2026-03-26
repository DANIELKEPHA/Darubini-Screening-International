"use client"

import { useState } from 'react';
import { useGetClientsQuery } from '@/state/api';
import { ClientList } from '@/state';
import ClientForm from '../../[slag]/cl/ClientForm';
import ClientTable from '../../[slag]/cl/ClientTable';
import { Button } from '@/components/ui/button';

export default function ClientManagement() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<ClientList | null>(null);
    const { data: clientData, isLoading, error } = useGetClientsQuery({ page: 1, limit: 100 });

    const handleEdit = (client: ClientList) => {
        setSelectedClient(client);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedClient(null);
        setIsFormOpen(false);
    };

    return (
        <div className="container mx-auto p-4 min-h-screen bg-gray-100">
            <h1 className="text-2xl font-bold mb-4">Client Management</h1>
            <div className="mb-4">
                <Button onClick={() => setIsFormOpen(true)}>Add Client</Button>
            </div>
            {isFormOpen && (
                <div className="mb-4">
                    <ClientForm client={selectedClient} onClose={handleCloseForm} />
                </div>
            )}
            {isLoading ? (
                <div className="text-center py-4">Loading clients...</div>
            ) : error ? (
                <div className="text-center py-4 text-red-600">
                    Error loading clients: {error instanceof Error ? error.message : 'Unknown error'}
                </div>
            ) : clientData?.clients && clientData.clients.length > 0 ? (
                <ClientTable clients={clientData.clients} onEdit={handleEdit} />
            ) : (
                <div className="text-center py-4">No clients found.</div>
            )}
        </div>
    );
}