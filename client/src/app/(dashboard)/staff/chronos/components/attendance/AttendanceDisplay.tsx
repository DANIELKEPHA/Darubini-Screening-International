'use client';

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetAttendanceRecordsQuery } from "@/state/api";
import { useDispatch } from "react-redux";
import { setAttendanceRecords, Attendance, AttendanceFilter } from "@/state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Loader2, ChevronRight, ChevronDown, Calendar, Folder, FileText, User, Clock, AlertCircle, ArrowDownLeft, ArrowUpRight, RefreshCw, BarChart3, X } from "lucide-react";
import { format, getWeekOfMonth } from "date-fns";

interface AttendanceDisplayProps {
    page: number;
    limit: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    filter: AttendanceFilter;
    authUserCognitoId?: string;
}

interface GroupedRecords {
    [month: string]: {
        [week: string]: {
            [day: string]: Attendance[];
        };
    };
}

const groupAttendanceRecords = (records: Attendance[]): GroupedRecords => {
    const grouped: GroupedRecords = {};
    records.forEach((record) => {
        const date = new Date(record.checkInTime || record.checkOutTime || Date.now());
        const month = format(date, "MMMM yyyy");
        const week = `Week ${getWeekOfMonth(date)}`;
        const day = format(date, "EEEE");

        if (!grouped[month]) grouped[month] = {};
        if (!grouped[month][week]) grouped[month][week] = {};
        if (!grouped[month][week][day]) grouped[month][week][day] = [];
        grouped[month][week][day].push(record);
    });
    return grouped;
};

const AttendanceDisplay: React.FC<AttendanceDisplayProps> = ({ page, limit, setPage, filter, authUserCognitoId }) => {
    const dispatch = useDispatch();
    const { data, isLoading, error, refetch } = useGetAttendanceRecordsQuery({ ...filter, page, limit });
    const [selectedDay, setSelectedDay] = useState<{ month: string; week: string; day: string } | null>(null);
    const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
    const [expandedWeeks, setExpandedWeeks] = useState<string[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const groupedRecords = useMemo(() => (data ? groupAttendanceRecords(data.records) : {}), [data]);

    React.useEffect(() => {
        if (data) {
            const totalPages = Math.ceil(data.total / limit);
            dispatch(setAttendanceRecords({
                records: data.records,
                total: data.total,
                page,
                limit,
                totalPages
            }));
        }
    }, [data, dispatch, limit, page]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refetch();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const toggleMonth = (month: string) => {
        setExpandedMonths((prev) =>
            prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
        );
    };

    const toggleWeek = (weekKey: string) => {
        setExpandedWeeks((prev) =>
            prev.includes(weekKey) ? prev.filter((w) => w !== weekKey) : [...prev, weekKey]
        );
    };

    const getUsername = (record: Attendance) => {
        const username = record.user?.name || record.admin?.name || record.accounts?.name || record.staff?.name;
        if (!username) {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="text-red-500 flex items-center text-sm">
                                Unknown User <AlertCircle className="ml-1 h-3 w-3" />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            No user found for cognitoId: {record.userCognitoId || record.adminCognitoId || record.accountsCognitoId || record.staffCognitoId || "N/A"}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }
        return username;
    };

    const stats = useMemo(() => {
        if (!data) return null;
        const totalRecords = data.total;
        const checkedIn = data.records.filter((r: Attendance) => r.status === 'CHECKED_IN').length;
        const checkedOut = data.records.filter((r: Attendance) => r.status === 'CHECKED_OUT').length;

        return { totalRecords, checkedIn, checkedOut };
    }, [data]);

    return (
        <CardContent className="p-8">
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                >
                    <div className="flex flex-col items-center justify-center">
                        <div className="relative">
                            <Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-600 mb-4" />
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-xl" />
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 font-medium text-lg mt-4">Loading attendance records...</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please wait while we fetch your data</p>
                    </div>
                </motion.div>
            )}

            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                >
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 max-w-md mx-auto">
                        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
                        <p className="text-red-600 dark:text-red-400 font-medium text-lg mb-2">Loading Error</p>
                        <p className="text-red-500 dark:text-red-400 text-sm">
                            {(error as any).data?.message || "Failed to load attendance records"}
                        </p>
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            size="sm"
                            className="mt-4 border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                        >
                            Try Again
                        </Button>
                    </div>
                </motion.div>
            )}

            {data && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="space-y-8"
                >

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                    <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Attendance Records</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {data.total} records • {Object.keys(groupedRecords).length} months
                                    </p>
                                </div>
                            </div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    onClick={handleRefresh}
                                    variant="outline"
                                    size="sm"
                                    disabled={isRefreshing}
                                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
                                >
                                    {isRefreshing ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                    )}
                                    Refresh
                                </Button>
                            </motion.div>
                        </div>
                    </div>

                    {/* Records Tree */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Object.keys(groupedRecords).map((month) => (
                            <motion.div
                                key={month}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 overflow-hidden"
                            >
                                <motion.button
                                    whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.02)" }}
                                    whileTap={{ scale: 0.995 }}
                                    onClick={() => toggleMonth(month)}
                                    className="w-full flex items-center justify-between p-6 text-left transition-colors duration-200"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                            <Folder className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">{month}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {Object.keys(groupedRecords[month]).length} weeks • {Object.values(groupedRecords[month]).flatMap(week => Object.keys(week)).length} days
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-full font-medium">
                                            {Object.values(groupedRecords[month]).flatMap(week => Object.values(week).flat()).length} records
                                        </span>
                                        <motion.div
                                            animate={{ rotate: expandedMonths.includes(month) ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg"
                                        >
                                            <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        </motion.div>
                                    </div>
                                </motion.button>

                                <AnimatePresence>
                                    {expandedMonths.includes(month) && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden border-t border-gray-100 dark:border-gray-700"
                                        >
                                            <div className="p-4 space-y-3">
                                                {Object.keys(groupedRecords[month]).map((week) => {
                                                    const weekKey = `${month}-${week}`;
                                                    return (
                                                        <motion.div
                                                            key={weekKey}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.1 }}
                                                            className="ml-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                                                        >
                                                            <motion.button
                                                                whileHover={{ backgroundColor: "rgba(99, 102, 241, 0.05)" }}
                                                                whileTap={{ scale: 0.99 }}
                                                                onClick={() => toggleWeek(weekKey)}
                                                                className="w-full flex items-center justify-between p-4 text-left transition-colors duration-200"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                                                        <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                                    </div>
                                                                    <span className="font-medium text-gray-700 dark:text-gray-300">{week}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full font-medium">
                                                                        {Object.values(groupedRecords[month][week]).flat().length} records
                                                                    </span>
                                                                    <motion.div
                                                                        animate={{ rotate: expandedWeeks.includes(weekKey) ? 180 : 0 }}
                                                                        transition={{ duration: 0.2 }}
                                                                        className="p-1 bg-gray-200 dark:bg-gray-600 rounded"
                                                                    >
                                                                        <ChevronDown className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                                                    </motion.div>
                                                                </div>
                                                            </motion.button>

                                                            <AnimatePresence>
                                                                {expandedWeeks.includes(weekKey) && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: "auto", opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        transition={{ duration: 0.3 }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <div className="ml-4 p-3 space-y-2">
                                                                            {Object.keys(groupedRecords[month][week]).map((day) => (
                                                                                <motion.button
                                                                                    key={day}
                                                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                                    transition={{ duration: 0.2 }}
                                                                                    onClick={() => setSelectedDay({ month, week, day })}
                                                                                    className={`w-full flex items-center justify-between p-3 text-left rounded-lg border transition-all duration-200 ${
                                                                                        selectedDay?.month === month &&
                                                                                        selectedDay?.week === week &&
                                                                                        selectedDay?.day === day
                                                                                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm"
                                                                                            : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800"
                                                                                    }`}
                                                                                >
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded">
                                                                                            <Clock className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                                                                        </div>
                                                                                        <div className="text-left">
                                                                                            <span className="font-medium text-gray-700 dark:text-gray-300 block text-sm">{day}</span>
                                                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                                                {groupedRecords[month][week][day].length} records
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <ChevronRight className={`h-4 w-4 transition-transform ${
                                                                                        selectedDay?.month === month && selectedDay?.week === week && selectedDay?.day === day
                                                                                            ? "text-blue-500 rotate-90"
                                                                                            : "text-gray-400"
                                                                                    }`} />
                                                                                </motion.button>
                                                                            ))}
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>

                    {/* Day Records Modal */}
                    <AnimatePresence>
                        {selectedDay && groupedRecords[selectedDay.month]?.[selectedDay.week]?.[selectedDay.day] && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                                onClick={() => setSelectedDay(null)}
                            >
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[80vh] overflow-hidden"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Modal Header */}
                                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                                    <User className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold">
                                                        Records for {selectedDay.day}, {selectedDay.week}, {selectedDay.month}
                                                    </h3>
                                                    <p className="text-blue-100 text-sm mt-1">
                                                        {groupedRecords[selectedDay.month][selectedDay.week][selectedDay.day].length} attendance records
                                                    </p>
                                                </div>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.1, rotate: 90 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setSelectedDay(null)}
                                                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                                            >
                                                <X className="h-5 w-5" />
                                            </motion.button>
                                        </div>
                                    </div>

                                    {/* Modal Content */}
                                    <div className="overflow-hidden">
                                        <div className="max-h-[60vh] overflow-y-auto">
                                            <Table>
                                                <TableHeader className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                                    <TableRow className="border-b border-gray-200 dark:border-gray-700">
                                                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-4 text-sm">User</TableHead>
                                                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-4 text-sm">Check-In</TableHead>
                                                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-4 text-sm">Check-Out</TableHead>
                                                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-4 text-sm">Status</TableHead>
                                                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-4 text-sm">Break Type</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {groupedRecords[selectedDay.month][selectedDay.week][selectedDay.day].map((record, index) => (
                                                        <motion.tr
                                                            key={record.id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.05 }}
                                                            className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
                                                        >
                                                            <TableCell className="py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                                                                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                                    </div>
                                                                    <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                                                                        {getUsername(record)}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4 text-sm text-gray-700 dark:text-gray-300">
                                                                {record.checkInTime ? (
                                                                    <div className="space-y-1">
                                                                        <div className="font-medium">{format(new Date(record.checkInTime), "PP")}</div>
                                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                            {format(new Date(record.checkInTime), "HH:mm")}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="py-4 text-sm text-gray-700 dark:text-gray-300">
                                                                {record.checkOutTime ? (
                                                                    <div className="space-y-1">
                                                                        <div className="font-medium">{format(new Date(record.checkOutTime), "PP")}</div>
                                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                            {format(new Date(record.checkOutTime), "HH:mm")}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                {record.status === "CHECKED_IN" ? (
                                                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                                                        <ArrowDownLeft className="h-4 w-4" />
                                                                        <span className="text-sm font-medium">Check-In</span>
                                                                    </div>
                                                                ) : record.status === "CHECKED_OUT" ? (
                                                                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                                                        <ArrowUpRight className="h-4 w-4" />
                                                                        <span className="text-sm font-medium">Check-Out</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                                                        <span className="text-sm font-medium capitalize">
                                                                            {record.status.toLowerCase().replace("_", " ")}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="py-4 text-sm text-gray-700 dark:text-gray-300">
                                                                {record.breakType ? (
                                                                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                                                                        {record.breakType.replace("_", " ")}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-400 dark:text-gray-500">-</span>
                                                                )}
                                                            </TableCell>
                                                        </motion.tr>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </CardContent>
    );
};

export default AttendanceDisplay;