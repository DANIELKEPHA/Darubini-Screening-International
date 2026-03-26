'use client';

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { OperationalExpense } from '@/state';

interface ExpensePieChartProps {
    expenses: OperationalExpense[];
    onCategorySelect: (category: string) => void;
}

export default function ExpensePieChart({ expenses, onCategorySelect }: ExpensePieChartProps) {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<Chart | null>(null);

    const getCategoryData = () => {
        const categories: { [key: string]: number } = {};

        // Dynamically aggregate expenses by accountType
        expenses.forEach(exp => {
            if (exp.accountType) {
                const amount = typeof exp.amount === 'string' ? parseFloat(exp.amount) : 0;
                if (!isNaN(amount)) {
                    categories[exp.accountType] = (categories[exp.accountType] || 0) + amount;
                }
            }
        });

        // Generate labels and colors dynamically
        const labels = Object.keys(categories).map(key => key.replace(/_/g, ' ').toLowerCase());
        const colors = labels.map((_, index) => {
            const hue = (index * 137.5) % 360; // Use golden angle for distinct colors
            return `hsl(${hue}, 70%, 60%)`;
        });

        return {
            labels,
            datasets: [{
                data: Object.values(categories),
                backgroundColor: colors.length > 0 ? colors : ['#D4A5A5'],
            }],
            categories: Object.keys(categories),
        };
    };

    useEffect(() => {
        if (chartRef.current) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            const chartData = getCategoryData();

            chartInstanceRef.current = new Chart(chartRef.current, {
                type: 'pie',
                data: {
                    labels: chartData.labels,
                    datasets: chartData.datasets,
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                    },
                    onClick: (e, elements) => {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            const category = chartData.categories[index]; // Use categories from chartData
                            if (category) {
                                onCategorySelect(category);
                            }
                        }
                    },
                },
            });
        }

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [expenses]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Expense Breakdown by Category</h2>
            <canvas ref={chartRef} className="max-h-96"></canvas>
        </div>
    );
}