"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, X, User, FileSpreadsheet } from 'lucide-react';

import {
    useCreateClientMutation,
    useUpdateClientMutation,
    useImportClientsFromCSVMutation,
} from '@/state/api';
import { ClientList } from '@/state';

const clientSchema = z.object({
    name: z.string().max(100).min(1, 'Client name is required'),
    contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof clientSchema>;

export default function ClientForm({
                                       onClose,
                                       client,
                                   }: {
    onClose: () => void;
    client?: ClientList | null;
}) {
    const isEdit = !!client;

    const [createClient, { isLoading: isCreating }] = useCreateClientMutation();
    const [updateClient, { isLoading: isUpdating }] = useUpdateClientMutation();
    const [importCsv, { isLoading: isImporting }] = useImportClientsFromCSVMutation();

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(client?.imageUrl || null);
    const [showCsvImport, setShowCsvImport] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: client?.customClientName || '',
            contactEmail: client?.contactEmail || '',
        },
    });

    useEffect(() => {
        if (!imageFile && client?.imageUrl) setPreview(client.imageUrl);
    }, [client?.imageUrl, imageFile]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setPreview(null);
    };

    const onSubmit = async (data: FormValues) => {
        try {
            const formData = new FormData();
            formData.append('customClientName', data.name);
            if (data.contactEmail) formData.append('contactEmail', data.contactEmail);
            formData.append('isActive', 'true');
            if (imageFile) formData.append('image', imageFile);

            if (isEdit && client) {
                await updateClient({ id: client.id, data: formData }).unwrap();
                toast.success('Client updated');
            } else {
                await createClient(formData).unwrap(); // This is correct
                toast.success('Client created');
            }
            onClose();
        } catch (err: any) {
            toast.error(err?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} client`);
        }
    };

    const isLoading = isCreating || isUpdating || isImporting;

    return (
        <>
            {/* Main Form */}
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-xl font-semibold">{isEdit ? 'Edit Client' : 'Add New Client'}</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Logo */}
                        <div>
                            <Label className="text-sm">Logo</Label>
                            <div className="mt-2 flex flex-col items-center">
                                <div className="w-28 h-28 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
                                    {preview ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img src={preview} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <User className="w-12 h-12 text-gray-400" />
                                    )}
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <Label className="cursor-pointer">
                                        <Input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                        <span className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" /> Change
                    </span>
                                    </Label>
                                    {preview && (
                                        <Button type="button" variant="ghost" size="sm" onClick={removeImage}>
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <Label htmlFor="name">Client Name</Label>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} placeholder="Acme Corp" disabled={isLoading} className="mt-1" />
                                )}
                            />
                            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <Label htmlFor="email">Contact Email (Optional)</Label>
                            <Controller
                                name="contactEmail"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} type="email" placeholder="client@example.com" disabled={isLoading} className="mt-1" />
                                )}
                            />
                            {errors.contactEmail && <p className="text-xs text-red-600 mt-1">{errors.contactEmail.message}</p>}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center pt-3">
                            <Button type="button" variant="ghost" size="sm" onClick={() => setShowCsvImport(true)} disabled={isLoading}>
                                <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                                Import CSV
                            </Button>

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" disabled={isLoading}>
                                    {isLoading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* CSV Import Dialog */}
            <Dialog open={showCsvImport} onOpenChange={setShowCsvImport}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg">Import Clients from CSV</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {csvFile ? (
                            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                                    <span className="text-sm font-medium truncate max-w-60">{csvFile.name}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCsvFile(null)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <Label className="cursor-pointer block">
                                <Input
                                    type="file"
                                    accept=".csv,text/csv"
                                    onChange={(e) => e.target.files?.[0] && setCsvFile(e.target.files[0])}
                                    className="hidden"
                                />
                                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg hover:border-gray-400 transition text-center">
                                    <FileSpreadsheet className="w-10 h-10 text-gray-400 mb-2" />
                                    <span className="text-sm font-medium">Click to select CSV</span>
                                    <span className="text-xs text-gray-500 mt-1">Only .csv files</span>
                                </div>
                            </Label>
                        )}

                        <p className="text-xs text-gray-500">
                            Columns: <code className="bg-gray-100 px-1 rounded">customClientName</code>,{' '}
                            <code className="bg-gray-100 px-1 rounded">contactEmail</code>,{' '}
                            <code className="bg-gray-100 px-1 rounded">imageUrl</code>, etc.
                        </p>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setShowCsvImport(false)} disabled={isImporting}>
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                disabled={!csvFile || isImporting}
                                onClick={async () => {
                                    if (!csvFile) return;
                                    const formData = new FormData();
                                    formData.append('file', csvFile);
                                    try {
                                        await importCsv(formData).unwrap();
                                        setShowCsvImport(false);
                                        onClose();
                                    } catch {}
                                }}
                            >
                                {isImporting ? 'Uploading...' : 'Upload & Import'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}