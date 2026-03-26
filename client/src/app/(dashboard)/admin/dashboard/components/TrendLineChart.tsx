'use client';

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { OperationalExpense } from '@/state';

interface TrendLineChartProps {
    expenses: OperationalExpense[];
    timeFrame: 'day' | 'week' | 'month';
    onTimeFrameChange: (timeFrame: 'day' | 'week' | 'month') => void;
}

export default function TrendLineChart({ expenses, timeFrame, onTimeFrameChange }: TrendLineChartProps) {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<Chart | null>(null);

    const getTrendData = () => {
        const dates: { [key: string]: number } = {};
        expenses.forEach(exp => {
            const date = new Date(exp.date);
            let key: string;
            if (timeFrame === 'day') key = date.toLocaleDateString();
            else if (timeFrame === 'week') key = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
            else key = date.toLocaleString('default', { month: 'short', year: 'numeric' });

            // Safely convert exp.amount to a number
            const amount = typeof exp.amount === 'string' ? parseFloat(exp.amount) : 0;
            if (!isNaN(amount)) {
                dates[key] = (dates[key] || 0) + amount;
            }
        });

        return {
            labels: Object.keys(dates).sort(),
            datasets: [{
                label: 'Expenses',
                data: Object.values(dates),
                borderColor: '#8d182c',
                backgroundColor: 'rgba(141, 24, 44, 0.2)',
                fill: false,
                tension: 0.1
            }]
        };
    };

    useEffect(() => {
        if (chartRef.current) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            chartInstanceRef.current = new Chart(chartRef.current, {
                type: 'line',
                data: getTrendData(),
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Amount' }
                        },
                        x: {
                            title: { display: true, text: 'Time' }
                        }
                    }
                }
            });
        }

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [expenses, timeFrame]);

    const handleTimeFrameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value as 'day' | 'week' | 'month';
        onTimeFrameChange(value);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Expense Trends</h2>
                <select
                    value={timeFrame}
                    onChange={handleTimeFrameChange}
                    className="rounded-lg border border-gray-200 bg-white py-2 px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="day">Daily</option>
                    <option value="week">Weekly</option>
                    <option value="month">Monthly</option>
                </select>
            </div>
            <canvas ref={chartRef} className="max-h-96"></canvas>
        </div>
    );
}