'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface UserActivityStatus {
    totalUsers: number;
    checkedIn: number;
    onBreak: number;
    checkedOut: number;
}

interface UserActivityStatusChartProps {
    status: UserActivityStatus;
}

const UserActivityStatusChart: React.FC<UserActivityStatusChartProps> = ({ status }) => {
    const data = {
        labels: ['Checked In', 'On Break', 'Checked Out'],
        datasets: [
            {
                label: 'User Activity',
                data: [status.checkedIn, status.onBreak, status.checkedOut],
                backgroundColor: ['rgb(141, 24, 44)', '#D9911E', 'rgba(141, 24, 44, 0.5)'],
                borderColor: ['#fff'],
                borderWidth: 1,
            },
        ],
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
            <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-300 mb-4">User Activity Status</h3>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Bar data={data} options={options} />
            </motion.div>
        </Card>
    );
};

export default UserActivityStatusChart;