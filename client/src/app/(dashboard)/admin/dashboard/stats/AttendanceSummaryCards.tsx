'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Clock, Users, CheckCircle, Percent } from 'lucide-react';

interface AttendanceSummary {
    totalHours: number;
    sessionCount: number;
    averageSessionDuration: number;
    complianceRate: number;
}

interface AttendanceSummaryCardsProps {
    summary: AttendanceSummary;
}

const AttendanceSummaryCards: React.FC<AttendanceSummaryCardsProps> = ({ summary }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-200/50 dark:border-primary-700/30 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-primary-700 dark:text-primary-300">Total Hours</p>
                            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{summary.totalHours.toFixed(2)}</p>
                        </div>
                        <Clock className="h-8 w-8 text-primary-500/60" />
                    </div>
                </Card>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
            >
                <Card className="bg-gradient-to-br from-secondary-50 to-secondary-100/50 dark:from-secondary-900/20 dark:to-secondary-800/20 border-secondary-200/50 dark:border-secondary-700/30 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Session Count</p>
                            <p className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">{summary.sessionCount}</p>
                        </div>
                        <Users className="h-8 w-8 text-secondary-500/60" />
                    </div>
                </Card>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
            >
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200/50 dark:border-blue-700/30 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Avg Session Duration</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.averageSessionDuration.toFixed(2)} hrs</p>
                        </div>
                        <Clock className="h-8 w-8 text-blue-500/60" />
                    </div>
                </Card>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
            >
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200/50 dark:border-purple-700/30 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Compliance Rate</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summary.complianceRate.toFixed(2)}%</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-purple-500/60" />
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};

export default AttendanceSummaryCards;