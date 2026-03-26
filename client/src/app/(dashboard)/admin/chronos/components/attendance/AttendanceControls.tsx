"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    useCheckInMutation,
    useCheckOutMutation,
    useValidateQRCodeMutation,
} from "@/state/api";
import { AttendanceFilter, BreakType } from "@/state";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Loader2,
    Clock,
    ChevronDown,
    QrCode,
    MapPin,
    Scan,
    Sparkles,
} from "lucide-react";
import { Scanner, IDetectedBarcode } from "@yudiel/react-qr-scanner";
import {Card} from "@/components/ui/card";

interface AttendanceControlsProps {
    authUserCognitoId?: string;
    filter: AttendanceFilter;
    onFilterChange: (key: keyof AttendanceFilter, value: string | undefined) => void;
}

const AttendanceControls: React.FC<AttendanceControlsProps> = ({
                                                                   authUserCognitoId,
                                                                   filter,
                                                                   onFilterChange,
                                                               }) => {
    const [checkIn] = useCheckInMutation();
    const [checkOut] = useCheckOutMutation();
    const [validateQRCode, { isLoading: isValidatingQRCode }] =
        useValidateQRCodeMutation();

    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [breakType, setBreakType] = useState<string | undefined>(undefined);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const handleCheckIn = async () => {
        if (!navigator.geolocation) {
            toast.error("🌍 Geolocation is not supported by this browser.");
            return;
        }
        setIsCheckingIn(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    await checkIn({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        breakType:
                            breakType === "NONE"
                                ? undefined
                                : (breakType as BreakType),
                    }).unwrap();
                    toast.success("🎉 Checked in successfully!", {
                        description: `Location: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
                    });
                } catch (err: any) {
                    toast.error("❌ Failed to check in", {
                        description: err.data?.message || "Please try again"
                    });
                } finally {
                    setIsCheckingIn(false);
                }
            },
            () => {
                toast.error("📍 Location access denied", {
                    description: "Please enable location services to check in"
                });
                setIsCheckingIn(false);
            }
        );
    };

    const handleCheckOut = async () => {
        if (!navigator.geolocation) {
            toast.error("🌍 Geolocation is not supported by this browser.");
            return;
        }
        setIsCheckingOut(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    await checkOut({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        breakType:
                            breakType === "NONE"
                                ? undefined
                                : (breakType as BreakType),
                    }).unwrap();
                    toast.success("👋 Checked out successfully!", {
                        description: `Location: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
                    });
                } catch (err: any) {
                    toast.error("❌ Failed to check out", {
                        description: err.data?.message || "Please try again"
                    });
                } finally {
                    setIsCheckingOut(false);
                }
            },
            () => {
                toast.error("📍 Location access denied", {
                    description: "Please enable location services to check out"
                });
                setIsCheckingOut(false);
            }
        );
    };

    const handleQRScan = async (detectedCodes: IDetectedBarcode[]) => {
        if (detectedCodes.length === 0 || isScanning) return;

        setIsScanning(true);
        const result = detectedCodes[0]?.rawValue;
        if (result && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        await validateQRCode({
                            locationId: result,
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            breakType:
                                breakType === "NONE"
                                    ? undefined
                                    : (breakType as BreakType),
                        }).unwrap();
                        toast.success("📱 Attendance recorded!", {
                            description: "QR code scanned successfully"
                        });
                        setShowQRScanner(false);
                    } catch (err: any) {
                        toast.error("❌ QR code error", {
                            description: err.data?.message || "Invalid QR code"
                        });
                    } finally {
                        setIsScanning(false);
                    }
                },
                () => {
                    toast.error("📍 Location required", {
                        description: "Enable location to scan QR code"
                    });
                    setIsScanning(false);
                }
            );
        }
    };

    const handleQRError = (error: unknown) => {
        console.error("QR Scanner error:", error);
        toast.error("📱 Scanner error", {
            description: "Please check camera permissions"
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="px-8 pb-8"
        >
            {/* Action Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Check In Card */}
                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-primary-600/5 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                    <Card className="relative bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white p-6 rounded-2xl shadow-lg border-0 cursor-pointer transition-all duration-300 group-hover:shadow-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Clock className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Check In</h3>
                                    <p className="text-primary-100 text-sm">Start your work day</p>
                                </div>
                            </div>
                            <Sparkles className="h-5 w-5 text-white/60 group-hover:scale-110 transition-transform" />
                        </div>
                        <Button
                            onClick={handleCheckIn}
                            disabled={isCheckingIn}
                            size="lg"
                            className="w-full mt-4 bg-white/20 hover:bg-white/30 border-white/30 text-white font-semibold py-6 rounded-xl transition-all duration-200 group-hover:bg-white/25"
                        >
                            {isCheckingIn ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <MapPin className="mr-2 h-5 w-5" />
                            )}
                            {isCheckingIn ? "Checking In..." : "Check In Now"}
                        </Button>
                    </Card>
                </motion.div>

                {/* Check Out Card */}
                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary-500/10 to-secondary-600/5 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                    <Card className="relative bg-gradient-to-br from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white p-6 rounded-2xl shadow-lg border-0 cursor-pointer transition-all duration-300 group-hover:shadow-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Clock className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Check Out</h3>
                                    <p className="text-secondary-100 text-sm">End your work day</p>
                                </div>
                            </div>
                            <Sparkles className="h-5 w-5 text-white/60 group-hover:scale-110 transition-transform" />
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    size="lg"
                                    className="w-full mt-4 bg-white/20 hover:bg-white/30 border-white/30 text-white font-semibold py-6 rounded-xl transition-all duration-200 group-hover:bg-white/25 flex items-center justify-between"
                                >
                                    <div className="flex items-center">
                                        <MapPin className="mr-2 h-5 w-5" />
                                        Check Out
                                    </div>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-primary-100 dark:border-primary-800">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                            Break Type
                                        </label>
                                        <Select
                                            onValueChange={setBreakType}
                                            value={breakType || ""}
                                        >
                                            <SelectTrigger className="w-full rounded-lg border-primary-200 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/20">
                                                <SelectValue placeholder="Select break type" />
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
                                    </div>
                                    <Button
                                        onClick={handleCheckOut}
                                        disabled={isCheckingOut}
                                        className="w-full bg-secondary-600 hover:bg-secondary-700 text-white font-semibold py-3 rounded-lg transition-all duration-200"
                                    >
                                        {isCheckingOut ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : null}
                                        Confirm Check Out
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </Card>
                </motion.div>

                {/* QR Scanner Card */}
                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-400/10 to-secondary-400/5 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                    <Card className="relative bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white p-6 rounded-2xl shadow-lg border-0 cursor-pointer transition-all duration-300 group-hover:shadow-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <QrCode className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">QR Code</h3>
                                    <p className="text-gray-300 text-sm">Scan to check in/out</p>
                                </div>
                            </div>
                            <Scan className="h-5 w-5 text-white/60 group-hover:scale-110 transition-transform" />
                        </div>
                        <Button
                            onClick={() => setShowQRScanner(!showQRScanner)}
                            size="lg"
                            disabled={isValidatingQRCode}
                            className="w-full mt-4 bg-white/20 hover:bg-white/30 border-white/30 text-white font-semibold py-6 rounded-xl transition-all duration-200 group-hover:bg-white/25"
                        >
                            {isValidatingQRCode ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <QrCode className="mr-2 h-5 w-5" />
                            )}
                            {showQRScanner ? "Close Scanner" : "Scan QR Code"}
                        </Button>
                    </Card>
                </motion.div>
            </div>

            {/* QR Scanner */}
            <AnimatePresence>
                {showQRScanner && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-full max-w-md mx-auto bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-xl p-6 border border-primary-100 dark:border-primary-800"
                    >
                        <div className="text-center mb-4">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">QR Scanner</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Point camera at QR code</p>
                        </div>
                        <div className="relative rounded-xl overflow-hidden border-2 border-primary-200 dark:border-primary-700">
                            <Scanner
                                onScan={handleQRScan}
                                onError={handleQRError}
                                constraints={{ facingMode: "environment" }}
                                styles={{
                                    container: { width: "100%" },
                                    video: { width: "100%", borderRadius: "8px" },
                                }}
                            />
                            {/* Scanner overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-48 h-48 border-2 border-white/30 rounded-lg relative">
                                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary-500"></div>
                                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary-500"></div>
                                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary-500"></div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary-500"></div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Position the QR code within the frame
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AttendanceControls;