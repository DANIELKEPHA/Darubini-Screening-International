'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Clock, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { AttendanceStatus, BreakType } from "@/state";
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AttendanceReportRecord {
    id: number;
    userId: string | null;
    name: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    totalHours: number | null;
    status: AttendanceStatus;
    breakType?: BreakType;
    autoCheckedOut: boolean;
}

interface AttendanceReportTableProps {
    report: AttendanceReportRecord[];
    timeFrame: 'day' | 'week' | 'month';
    onTimeFrameChange: (timeFrame: 'day' | 'week' | 'month') => void;
}

const AttendanceReportTable: React.FC<AttendanceReportTableProps> = ({ report, timeFrame, onTimeFrameChange }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 5;

    // Sort records by checkInTime in descending order
    const sortedRecords = [...report].sort((a, b) => {
        const dateA = a.checkInTime ? new Date(a.checkInTime).getTime() : 0;
        const dateB = b.checkInTime ? new Date(b.checkInTime).getTime() : 0;
        return dateB - dateA; // Descending order
    });

    const totalPages = Math.ceil(sortedRecords.length / recordsPerPage);

    // Calculate the records to display for the current page
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const currentRecords = sortedRecords.slice(startIndex, endIndex);

    // Handle page navigation
    const goToPreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const goToNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    return (
        <Card className="bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-200/50 dark:border-primary-700/30 rounded-2xl">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-300">Attendance Report</h3>
                    <Select value={timeFrame} onValueChange={onTimeFrameChange}>
                        <SelectTrigger className="w-32 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="day">Day</SelectItem>
                            <SelectItem value="week">Week</SelectItem>
                            <SelectItem value="month">Month</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Table>
                        <TableHeader className="bg-primary-50 dark:bg-primary-900/20">
                            <TableRow className="border-b border-primary-200 dark:border-primary-700">
                                <TableHead className="font-semibold text-primary-700 dark:text-primary-300 py-4 text-sm uppercase tracking-wide">User</TableHead>
                                <TableHead className="font-semibold text-primary-700 dark:text-primary-300 py-4 text-sm uppercase tracking-wide">Check-In</TableHead>
                                <TableHead className="font-semibold text-primary-700 dark:text-primary-300 py-4 text-sm uppercase tracking-wide">Check-Out</TableHead>
                                <TableHead className="font-semibold text-primary-700 dark:text-primary-300 py-4 text-sm uppercase tracking-wide">Status</TableHead>
                                <TableHead className="font-semibold text-primary-700 dark:text-primary-300 py-4 text-sm uppercase tracking-wide">Break Type</TableHead>
                                <TableHead className="font-semibold text-primary-700 dark:text-primary-300 py-4 text-sm uppercase tracking-wide">Total Hours</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentRecords.map((record, index) => (
                                <motion.tr
                                    key={record.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="border-b border-primary-100 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                                >
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 flex items-center justify-center">
                                                <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <span className="font-medium text-primary-800 dark:text-primary-200 text-sm">{record.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 text-sm text-primary-700 dark:text-primary-300">
                                        {record.checkInTime ? format(new Date(record.checkInTime), 'PP HH:mm') : '-'}
                                    </TableCell>
                                    <TableCell className="py-4 text-sm text-primary-700 dark:text-primary-300">
                                        {record.checkOutTime ? format(new Date(record.checkOutTime), 'PP HH:mm') : '-'}
                                    </TableCell>
                                    <TableCell className="py-4">
                                        {record.status === 'CHECKED_IN' ? (
                                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                                <ArrowDownLeft className="h-4 w-4" />
                                                <span className="text-sm font-medium">Check-In</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                                <ArrowUpRight className="h-4 w-4" />
                                                <span className="text-sm font-medium">Check-Out</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-4 text-sm text-primary-700 dark:text-primary-300">
                                        {record.breakType ? (
                                            <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full text-xs font-medium">
                                                {record.breakType.replace('_', ' ')}
                                            </span>
                                        ) : (
                                            '-'
                                        )}
                                    </TableCell>
                                    <TableCell className="py-4 text-sm text-primary-700 dark:text-primary-300">
                                        {record.totalHours ? record.totalHours.toFixed(2) : '-'}
                                    </TableCell>
                                </motion.tr>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-primary-700 dark:text-primary-300">
                            Showing {startIndex + 1} to {Math.min(endIndex, sortedRecords.length)} of {sortedRecords.length} records
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToPreviousPage}
                                disabled={currentPage === 1}
                                className="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToNextPage}
                                disabled={currentPage === totalPages}
                                className="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </CardContent>
        </Card>
    );
};

export default AttendanceReportTable;