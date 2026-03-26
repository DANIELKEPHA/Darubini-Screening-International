// app/(Items)/admin/emails/components/AnalyticsDashboard.tsx
"use client";

import { useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from "recharts";
import {Calendar, Filter, Download, Send, Eye, MousePointerClick, ArrowLeftToLine} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { cn } from "@/lib/utils";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {CalendarComponent} from "@/app/(dashboard)/admin/emails/components/ui/calendar/CalendarComponent";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

interface AnalyticsDashboardProps {
    data?: any;
    isLoading: boolean;
    timeRange: "7d" | "30d" | "90d";
}

export function AnalyticsDashboard({ data, isLoading, timeRange }: AnalyticsDashboardProps) {
    const [range, setRange] = useState<DateRange | undefined>();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });

    const [metricFilter, setMetricFilter] = useState("all");
    const [campaignFilter, setCampaignFilter] = useState("all");

    // Sample data - replace with your actual data
    const performanceData = [
        { name: "Jan", opens: 4000, clicks: 2400, bounces: 2400 },
        { name: "Feb", opens: 3000, clicks: 1398, bounces: 2210 },
        { name: "Mar", opens: 2000, clicks: 9800, bounces: 2290 },
        { name: "Apr", opens: 2780, clicks: 3908, bounces: 2000 },
        { name: "May", opens: 1890, clicks: 4800, bounces: 2181 },
        { name: "Jun", opens: 2390, clicks: 3800, bounces: 2500 },
        { name: "Jul", opens: 3490, clicks: 4300, bounces: 2100 },
    ];

    const campaignData = [
        { name: "Welcome Series", value: 35 },
        { name: "Promotional", value: 25 },
        { name: "Newsletter", value: 20 },
        { name: "Abandoned Cart", value: 15 },
        { name: "Other", value: 5 },
    ];

    const deviceData = [
        { name: "Mobile", value: 55 },
        { name: "Desktop", value: 35 },
        { name: "Tablet", value: 10 },
    ];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full md:w-[280px] justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                            {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                                dateRange={range}
                                onDateRangeChange={setRange}
                                numberOfMonths={2}
                            />

                        </PopoverContent>
                    </Popover>

                    <Select value={metricFilter} onValueChange={setMetricFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <SelectValue placeholder="Metric" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Metrics</SelectItem>
                            <SelectItem value="opens">Opens Only</SelectItem>
                            <SelectItem value="clicks">Clicks Only</SelectItem>
                            <SelectItem value="bounces">Bounces Only</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <SelectValue placeholder="Campaign" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Campaigns</SelectItem>
                            <SelectItem value="welcome">Welcome Series</SelectItem>
                            <SelectItem value="promo">Promotional</SelectItem>
                            <SelectItem value="newsletter">Newsletter</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Sent"
                    value="12,459"
                    change="+12.3%"
                    isPositive={true}
                    icon={<Send className="h-5 w-5 text-blue-500" />}
                />
                <StatCard
                    title="Open Rate"
                    value="24.5%"
                    change="+2.1%"
                    isPositive={true}
                    icon={<Eye className="h-5 w-5 text-green-500" />}
                />
                <StatCard
                    title="Click Rate"
                    value="3.2%"
                    change="-0.5%"
                    isPositive={false}
                    icon={<MousePointerClick className="h-5 w-5 text-yellow-500" />}
                />
                <StatCard
                    title="Bounce Rate"
                    value="1.8%"
                    change="-0.2%"
                    isPositive={true}
                    icon={<ArrowLeftToLine className="h-5 w-5 text-red-500" />}
                />
            </div>

            {/* Performance Over Time */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-lg">Performance Over Time</h3>
                    <Select defaultValue={timeRange}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Time Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="30d">Last 30 Days</SelectItem>
                            <SelectItem value="90d">Last 90 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="opens"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                activeDot={{ r: 8 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="clicks"
                                stroke="#10B981"
                                strokeWidth={2}
                            />
                            <Line
                                type="monotone"
                                dataKey="bounces"
                                stroke="#EF4444"
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Campaign Distribution and Device Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-medium text-lg mb-4">Campaign Distribution</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={campaignData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }: any) => (
                                        <tspan>
                                            {name}: {((percent ?? 0) * 100).toFixed(0)}%
                                        </tspan>
                                    )}
                                >
                                    {campaignData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-medium text-lg mb-4">Device Breakdown</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={deviceData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" />
                                <Tooltip />
                                <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                                    {deviceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Top Performing Campaigns */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-medium text-lg mb-4">Top Performing Campaigns</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Campaign
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sent
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Open Rate
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Click Rate
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Revenue
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {[1, 2, 3, 4, 5].map((item) => (
                            <tr key={item}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    Summer Sale {item}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {Math.floor(Math.random() * 5000) + 1000}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {(Math.random() * 20 + 15).toFixed(1)}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {(Math.random() * 5 + 2).toFixed(1)}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ${(Math.random() * 5000 + 1000).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: string;
    change: string;
    isPositive: boolean;
    icon: React.ReactNode;
}

function StatCard({ title, value, change, isPositive, icon }: StatCardProps) {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between">
                <h4 className="text-sm font-medium text-gray-500">{title}</h4>
                <div className="h-5 w-5">{icon}</div>
            </div>
            <div className="mt-2">
                <p className="text-2xl font-semibold">{value}</p>
                <p
                    className={`text-sm mt-1 ${
                        isPositive ? "text-green-600" : "text-red-600"
                    }`}
                >
                    {change} {isPositive ? "↑" : "↓"}
                </p>
            </div>
        </div>
    );
}