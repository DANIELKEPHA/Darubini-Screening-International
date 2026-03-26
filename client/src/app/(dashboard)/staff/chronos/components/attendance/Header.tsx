'use client';
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CardHeader } from "@/components/ui/card";
import { Sun, Moon, Clock, Sparkles, Target, TrendingUp, Zap, Star } from "lucide-react";
import { useGetAttendanceRecordsQuery } from "@/state/api";
import { AttendanceFilter } from "@/state";
import { format } from "date-fns";

interface HeaderProps {
    username: string;
}

const Header: React.FC<HeaderProps> = ({ username }) => {
    const [currentTime, setCurrentTime] = useState<string>("");
    const [greetingIcon, setGreetingIcon] = useState<React.ReactNode>(<Sun />);
    const [pulseEffect, setPulseEffect] = useState(false);

    // ── Fetch today's attendance records ────────────────────────────────
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const filter: AttendanceFilter = {
        startDate: todayStart.toISOString(),
        endDate: todayEnd.toISOString(),
    };

    const { data: attendanceData, isLoading: isAttendanceLoading } = useGetAttendanceRecordsQuery(
        { ...filter, page: 1, limit: 10 }
    );

    // Get latest check-in and check-out
    const { checkInTime, checkOutTime } = useMemo(() => {
        if (!attendanceData?.records?.length) {
            return { checkInTime: null, checkOutTime: null };
        }

        // Get the most recent record
        const sorted = [...attendanceData.records].sort((a, b) =>
            new Date(b.checkInTime || 0).getTime() - new Date(a.checkInTime || 0).getTime()
        );

        const latest = sorted[0];

        return {
            checkInTime: latest?.checkInTime ? format(new Date(latest.checkInTime), "hh:mm a") : null,
            checkOutTime: latest?.checkOutTime ? format(new Date(latest.checkOutTime), "hh:mm a") : null,
        };
    }, [attendanceData]);

    // ── Time-based greeting logic ────────────────────────────────
    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return { greeting: "Good Morning", icon: Sun, color: "from-amber-400 to-orange-500" };
        if (hour < 17) return { greeting: "Good Afternoon", icon: Sun, color: "from-sky-400 to-blue-500" };
        return { greeting: "Good Evening", icon: Moon, color: "from-indigo-500 to-purple-600" };
    };

    const timeGreeting = getTimeBasedGreeting();

    const motivationalMessages = [
        { text: "Today's efforts shape tomorrow's success", icon: <TrendingUp className="h-4 w-4" /> },
        { text: "Make every moment count", icon: <Clock className="h-4 w-4" /> },
        { text: "Lead with purpose and passion", icon: <Target className="h-4 w-4" /> },
        { text: "Your dedication drives results", icon: <Zap className="h-4 w-4" /> },
        { text: "Excellence is a habit", icon: <Star className="h-4 w-4" /> },
    ];

    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
        const updateCurrentTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
        };

        updateCurrentTime();
        const timeInterval = setInterval(updateCurrentTime, 60000);

        const messageInterval = setInterval(() => {
            setCurrentMessageIndex((prev) => (prev + 1) % motivationalMessages.length);
        }, 5000);

        const pulseInterval = setInterval(() => {
            setPulseEffect(true);
            setTimeout(() => setPulseEffect(false), 1000);
        }, 10000);

        const IconComponent = timeGreeting.icon;
        setGreetingIcon(<IconComponent className="h-6 w-6" />);

        return () => {
            clearInterval(timeInterval);
            clearInterval(messageInterval);
            clearInterval(pulseInterval);
        };
    }, [timeGreeting.icon]);

    const getFirstName = (name: string) => name?.trim().split(/\s+/)[0] || "";

    return (
        <CardHeader className="pb-8 pt-12 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-secondary-50/30 dark:from-gray-900/50 dark:to-gray-800/50"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent"></div>

            <div className="relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8"
                >
                    {/* Left: Greeting */}
                    <div className="flex items-center gap-4">
                        <motion.div
                            animate={{ rotate: [0, 5, 0, -5, 0], scale: pulseEffect ? [1, 1.1, 1] : 1 }}
                            transition={{ rotate: { duration: 2, repeat: Infinity, ease: "easeInOut" }, scale: { duration: 1 } }}
                            className={`p-3 bg-gradient-to-br ${timeGreeting.color} rounded-2xl shadow-lg`}
                        >
                            {greetingIcon}
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                                {timeGreeting.greeting},{" "}
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
                  {getFirstName(username)}
                </span>
                                !
                            </h1>
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={currentMessageIndex}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-2 mt-1"
                                >
                                    <Sparkles className="h-3 w-3 text-primary-500" />
                                    {motivationalMessages[currentMessageIndex].text}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right: Time Cards + Progress Indicators */}
                    <div className="flex flex-col items-end gap-6 min-w-[280px]">
                        {/* Time Cards */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Modified Check-in / Check-out Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 min-w-[140px]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                                        <Clock className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                            {checkOutTime
                                                ? "You Checked out at"
                                                : checkInTime
                                                    ? "You Checked in at"
                                                    : "Today's status"}
                                        </p>
                                        <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                                            {isAttendanceLoading ? (
                                                <span className="text-gray-400">Loading...</span>
                                            ) : checkOutTime ? (
                                                checkOutTime
                                            ) : checkInTime ? (
                                                checkInTime
                                            ) : (
                                                <span className="text-gray-400">Not checked in</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Current Time Card - unchanged */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-800/80 dark:to-gray-700/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-primary-100 dark:border-primary-800/30 min-w-[140px]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 bg-gradient-to-br ${timeGreeting.color} rounded-lg`}>
                                        <Clock className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Current time</p>
                                        <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                                            {currentTime || "—"}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Progress Indicators - unchanged */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="flex justify-end gap-6"
                        >
                            {["Morning", "Afternoon", "Evening"].map((period) => {
                                const isCurrent =
                                    (timeGreeting.greeting === "Good Morning" && period === "Morning") ||
                                    (timeGreeting.greeting === "Good Afternoon" && period === "Afternoon") ||
                                    (timeGreeting.greeting === "Good Evening" && period === "Evening");

                                return (
                                    <div key={period} className="flex flex-col items-center">
                                        <div
                                            className={`h-2 w-16 rounded-full mb-2 ${
                                                isCurrent
                                                    ? "bg-gradient-to-r from-primary-500 to-secondary-500"
                                                    : "bg-gray-200 dark:bg-gray-700"
                                            }`}
                                        />
                                        <span
                                            className={`text-xs font-medium ${
                                                isCurrent ? "text-primary-600 dark:text-primary-400" : "text-gray-400 dark:text-gray-500"
                                            }`}
                                        >
                      {period}
                    </span>
                                    </div>
                                );
                            })}
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </CardHeader>
    );
};

export default Header;