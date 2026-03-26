"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    FileText,
    Upload,
    Download,
    Trash2,
    File,
    AlertCircle,
    Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    useUploadProofFileMutation,
    useDeleteProofFileMutation,
    useGetSignedProofFileUrlQuery,
} from "@/state/api";
import type { ProofFile } from "@/state/types";

interface ProofFilesSectionProps {
    clientExpenseId: number;
    proofFiles: ProofFile[];
    isPaid: boolean;
    isCancelled: boolean;
    isRejected: boolean;
    refetchProofFiles: () => void;
}

export default function ProofFilesSection({
                                              clientExpenseId,
                                              proofFiles,
                                              isPaid,
                                              isCancelled,
                                              isRejected,
                                              refetchProofFiles,
                                          }: ProofFilesSectionProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [uploadProofFile, { isLoading: isUploading }] = useUploadProofFileMutation();
    const [deleteProofFile] = useDeleteProofFileMutation();

    const canUploadProof = isPaid && !isCancelled && !isRejected;

    // Shared validation & upload logic
    const processFile = async (file: File) => {
        if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
            toast.error("Only JPEG, PNG, WebP, or PDF files are allowed");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File must be under 5MB");
            return;
        }

        try {
            await uploadProofFile({
                file,
                expenseType: "CLIENT",
                clientExpenseId,
            }).unwrap();

            toast.success("Proof file uploaded successfully!");
            refetchProofFiles();
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to upload file");
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        await processFile(file);

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFilesDrop = async (files: File[]) => {
        const file = files[0];
        if (file) await processFile(file);
    };

    // Copy & Paste support
    useEffect(() => {
        if (!canUploadProof) return;

        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of items) {
                if (item.kind === "file") {
                    const file = item.getAsFile();
                    if (file) {
                        e.preventDefault(); // Prevent default paste behavior
                        processFile(file);
                        break; // Only handle the first file
                    }
                }
            }
        };

        document.addEventListener("paste", handlePaste);
        return () => document.removeEventListener("paste", handlePaste);
    }, [canUploadProof, clientExpenseId]);

    const handleDelete = async (proofFileId: number) => {
        if (!confirm("Are you sure you want to delete this proof file?")) return;

        try {
            await deleteProofFile(proofFileId).unwrap();
            toast.success("Proof file deleted");
            refetchProofFiles();
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to delete file");
        }
    };

    const FileItem = ({ file }: { file: ProofFile }) => {
        const { data: signedUrl, isLoading: urlLoading, isError } =
            useGetSignedProofFileUrlQuery(file.id, { skip: !file.id });

        const handleDownload = () => {
            if (signedUrl) {
                window.open(signedUrl, "_blank", "noopener,noreferrer");
            }
        };

        const fileName =
            decodeURIComponent(file.url.split("/").pop()?.split("?")[0] || "file");
        const isPdf = fileName.toLowerCase().endsWith(".pdf");

        return (
            <div
                key={file.id}
                className="group flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all"
            >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                        {isPdf ? (
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-7 h-7 text-red-600" />
                            </div>
                        ) : (
                            <div className="w-12 h-12 bg-blue-100 rounded-lg overflow-hidden">
                                <img
                                    src={file.url}
                                    alt="preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                        (
                                            e.target as HTMLImageElement
                                        ).nextElementSibling?.classList.remove("hidden");
                                    }}
                                />
                                <File className="w-7 h-7 text-blue-600 hidden" />
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-md">
                            {fileName}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
              <span>
                by{" "}
                  {file.uploadedByStaff?.name ||
                      file.uploadedByAccounts?.name ||
                      "Unknown"}
              </span>
                            <span>•</span>
                            <span>{format(new Date(file.createdAt), "dd MMM yyyy")}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 text-blue-600 hover:bg-blue-50"
                        onClick={handleDownload}
                        disabled={urlLoading || !signedUrl || isError}
                    >
                        {urlLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                    </Button>

                    {canUploadProof && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 w-9 p-0 text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(file.id)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Proof of Payment
                    {proofFiles.length > 0 && (
                        <span className="text-gray-500 font-normal">({proofFiles.length})</span>
                    )}
                </p>

                {canUploadProof && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 text-xs"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        <Upload className="w-3.5 h-3.5" />
                        {isUploading ? "Uploading..." : "Upload Proof"}
                    </Button>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Upload Zone */}
            {canUploadProof ? (
                <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 mt-4 ${
                        isDragActive
                            ? "border-primary bg-primary/5"
                            : "border-gray-300 hover:border-gray-400 bg-gray-50"
                    }`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragActive(true);
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragActive(false);
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragActive(false);
                        const files = Array.from(e.dataTransfer.files);
                        if (files.length > 0) handleFilesDrop(files);
                    }}
                >
                    <Upload
                        className={`w-10 h-10 mx-auto mb-3 transition-colors ${
                            isDragActive ? "text-primary" : "text-gray-400"
                        }`}
                    />
                    <p className="text-sm font-medium text-gray-700">
                        {isDragActive ? "Drop your file here" : "Drag & drop proof file here"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        or{" "}
                        <span
                            className="text-primary underline cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
              browse
            </span>{" "}
                        • or <span className="font-semibold">paste</span> from clipboard
                    </p>
                    <p className="text-xs text-gray-400 mt-3">
                        JPEG, PNG, WebP, PDF • Max 5MB
                    </p>
                </div>
            ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-center mt-4">
                    <AlertCircle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-amber-800">
                        Proof of payment can only be uploaded after the expense is approved and paid
                    </p>
                    <p className="text-xs text-amber-700 mt-2">
                        Current status:{" "}
                        <span className="font-semibold">
              {isPaid ? "Paid" : isCancelled ? "Cancelled" : isRejected ? "Rejected" : "Pending"}
            </span>
                    </p>
                </div>
            )}

            {/* File List */}
            <div className="mt-6 space-y-3">
                {proofFiles.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <FileText className="w-14 h-14 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm font-medium">No proof files uploaded yet</p>
                        <p className="text-xs mt-1">
                            Upload a receipt or invoice once payment is made
                        </p>
                    </div>
                ) : (
                    proofFiles.map((file) => <FileItem key={file.id} file={file} />)
                )}
            </div>
        </div>
    );
}