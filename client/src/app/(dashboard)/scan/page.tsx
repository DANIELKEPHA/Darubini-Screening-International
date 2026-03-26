"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useValidateQRCodeMutation, useGetAuthUserQuery } from "@/state/api";
import { BreakType } from "@/state";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const ScanPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const locationId = searchParams.get("locationId");
    const [breakType, setBreakType] = useState<string | undefined>(undefined);
    const [showBreakType, setShowBreakType] = useState(false);
    const [validateQRCode, { isLoading: isValidatingQRCode }] = useValidateQRCodeMutation();
    const { data: authUser, isLoading: isAuthLoading, error: authError } = useGetAuthUserQuery(undefined, {
        pollingInterval: 0,
    });

    useEffect(() => {
        if (!isAuthLoading && !authUser) {
            toast.error("Please sign in to scan the QR code.");
            router.push(`/signin?returnUrl=${encodeURIComponent(`/scan?locationId=${locationId || ''}`)}`);
        } else if (authUser && !['admin', 'accounts', 'staff'].includes(authUser.userRole)) {
            toast.error("Access denied: Admin, accounts, or staff role required.");
            router.push("/signin");
        }
    }, [authUser, isAuthLoading, router, locationId]);

    const handleAction = async (action: "check-in" | "check-out") => {
        if (!locationId) {
            toast.error("Invalid QR code: Missing location ID.");
            return;
        }
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by this browser.");
            return;
        }

        if (action === "check-out" && !showBreakType) {
            setShowBreakType(true);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    await validateQRCode({
                        locationId,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        breakType: action === "check-out" && breakType !== "NONE" ? (breakType as BreakType) : undefined,
                    }).unwrap();
                    toast.success(`Successfully ${action === "check-in" ? "checked in" : "checked out"}!`);
                    router.push("/"); // Redirect to homepage or attendance dashboard
                } catch (err: any) {
                    toast.error(err.data?.message || `Failed to ${action === "check-in" ? "check in" : "check out"}.`);
                    console.error(`${action} error:`, err);
                }
            },
            (geoError) => {
                toast.error("Geolocation permission denied.");
                console.error("Geolocation error:", geoError);
            }
        );
    };

    if (isAuthLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (authError || !authUser || !['admin', 'accounts', 'staff'].includes(authUser.userRole)) {
        return null; // Handled by useEffect redirects
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="container mx-auto px-4 py-8 flex flex-col items-center min-h-screen"
        >
            <h1 className="text-2xl font-bold mb-4">QR Code Check-In/Check-Out</h1>
            <p className="text-muted-foreground mb-6 text-center">
                Scan confirmed for Location ID: {locationId || "Unknown"}
            </p>
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col gap-4">
                <div className="flex flex-col items-center gap-4">
                    <QrCode className="h-12 w-12 text-primary" />
                    <Button
                        onClick={() => handleAction("check-in")}
                        disabled={isValidatingQRCode || !locationId}
                        className="bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 text-white w-full"
                    >
                        {isValidatingQRCode ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <QrCode className="mr-2 h-4 w-4" />
                        )}
                        Check In
                    </Button>
                    <Button
                        onClick={() => handleAction("check-out")}
                        disabled={isValidatingQRCode || !locationId}
                        className="bg-gradient-to-r from-red-600 to-orange-700 hover:from-red-700 hover:to-orange-800 text-white w-full"
                    >
                        {isValidatingQRCode ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <QrCode className="mr-2 h-4 w-4" />
                        )}
                        Check Out
                    </Button>
                    {showBreakType && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.3 }}
                            className="w-full"
                        >
                            <Select onValueChange={setBreakType} value={breakType || ""}>
                                <SelectTrigger className="w-full rounded-lg shadow-sm border-input">
                                    <SelectValue placeholder="Select break type (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NONE">No Break</SelectItem>
                                    {Object.values(BreakType).map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type.replace("_", " ")}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={() => handleAction("check-out")}
                                disabled={isValidatingQRCode || !locationId}
                                className="mt-4 bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white w-full"
                            >
                                {isValidatingQRCode ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <QrCode className="mr-2 h-4 w-4" />
                                )}
                                Confirm Check Out
                            </Button>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ScanPage;