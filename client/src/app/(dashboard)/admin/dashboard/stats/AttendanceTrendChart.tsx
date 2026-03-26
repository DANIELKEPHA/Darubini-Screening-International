'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface AttendanceTrends {
    byDayOfWeek: { day: string; count: number; totalHours: number }[];
    byHourOfDay: { hour: number; count: number }[];
    byWeekOfMonth: { week: number; count: number; totalHours: number }[];
}

interface AttendanceTrendChartProps {
    trends: AttendanceTrends;
    timeFrame: 'day' | 'week' | 'month';
    onTimeFrameChange: (timeFrame: 'day' | 'week' | 'month') => void;
}

const AttendanceTrendChart: React.FC<AttendanceTrendChartProps> = ({ trends, timeFrame, onTimeFrameChange }) => {
    const data = {
        labels: timeFrame === 'day' ? trends.byHourOfDay.map(h => `${h.hour}:00`) :
            timeFrame === 'week' ? trends.byDayOfWeek.map(d => d.day) :
                trends.byWeekOfMonth.map(w => `Week ${w.week}`),
        datasets: [
            {
                label: 'Attendance Count',
                data: timeFrame === 'day' ? trends.byHourOfDay.map(h => h.count) :
                    timeFrame === 'week' ? trends.byDayOfWeek.map(d => d.count) :
                        trends.byWeekOfMonth.map(w => w.count),
                borderColor: 'rgb(141, 24, 44)',
                backgroundColor: 'rgba(141, 24, 44, 0.2)',
                fill: true,
                tension: 0.4,
            },
            timeFrame !== 'day' && {
                label: 'Total Hours',
                data: timeFrame === 'week' ? trends.byDayOfWeek.map(d => d.totalHours) :
                    trends.byWeekOfMonth.map(w => w.totalHours),
                borderColor: '#D9911E',
                backgroundColor: 'rgba(217, 145, 30, 0.2)',
                fill: true,
                tension: 0.4,
            },
        ].filter(Boolean) as any[],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            tooltip: { mode: 'index' as const, intersect: false },
        },
        scales: {
            y: { beginAtZero: true },
        },
    };

    return (
        <Card className="bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-200/50 dark:border-primary-700/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-300">Attendance Trends</h3>
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
                <Line data={data} options={options} />
            </motion.div>
        </Card>
    );
};

export default AttendanceTrendChart;