'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend);

interface BreakAnalytics {
    totalBreaks: number;
    byType: Record<string, number>;
}

interface AttendancePieChartProps {
    analytics: BreakAnalytics;
}

const AttendancePieChart: React.FC<AttendancePieChartProps> = ({ analytics }) => {
    const data = {
        labels: Object.keys(analytics.byType).map(type => type.replace('_', ' ')),
        datasets: [
            {
                data: Object.values(analytics.byType),
                backgroundColor: ['rgb(141, 24, 44)', '#D9911E', 'rgba(141, 24, 44, 0.5)', 'rgba(217, 145, 30, 0.5)'],
                borderColor: ['#fff'],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            tooltip: {
                callbacks: {
                    label: (context: any) => `${context.label}: ${context.parsed} breaks`,
                },
            },
        },
    };

    return (
        <Card className="bg-gradient-to-br from-secondary-50 to-secondary-100/50 dark:from-secondary-900/20 dark:to-secondary-800/20 border-secondary-200/50 dark:border-secondary-700/30 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-secondary-700 dark:text-secondary-300 mb-4">Break Analytics</h3>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Pie data={data} options={options} />
            </motion.div>
        </Card>
    );
};

export default AttendancePieChart;