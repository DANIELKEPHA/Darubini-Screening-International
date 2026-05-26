"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
    Bell,
    Mail,
    Smartphone,
    MessageCircle,
    Calendar,
    TrendingUp,
    Users,
    AlertTriangle,
    CheckCircle,
    Settings,
    Volume2,
    VolumeX,
    Clock
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const NotificationPage = () => {
    const [notificationSettings, setNotificationSettings] = React.useState({
        email: { enabled: true, types: ["updates", "security", "marketing"] },
        push: { enabled: true, sound: true, types: ["messages", "alerts"] },
        sms: { enabled: false, types: ["security"] },
        digest: { enabled: true, frequency: "daily" }
    });

    const [soundEnabled, setSoundEnabled] = React.useState(true);
    const [volume, setVolume] = React.useState([70]);

    const notificationCategories = [
        {
            title: "Account Updates",
            icon: Users,
            description: "Changes to your account and profile",
            color: "from-blue-500 to-cyan-500",
            enabled: true
        },
        {
            title: "Security Alerts",
            icon: AlertTriangle,
            description: "Important security notifications",
            color: "from-red-500 to-rose-500",
            enabled: true,
            badge: "High Priority"
        },
        {
            title: "Marketing & Promotions",
            icon: TrendingUp,
            description: "News, updates, and special offers",
            color: "from-purple-500 to-pink-500",
            enabled: false
        },
        {
            title: "System Notifications",
            icon: Settings,
            description: "Maintenance and system updates",
            color: "from-gray-500 to-gray-600",
            enabled: true
        }
    ];

    const recentNotifications = [
        { title: "Security alert: New login detected", time: "5 minutes ago", type: "security", read: false },
        { title: "Your profile has been updated", time: "2 hours ago", type: "account", read: true },
        { title: "Weekly digest is ready", time: "1 day ago", type: "system", read: true },
    ];

    const getNotificationIcon = (type: string) => {
        switch(type) {
            case "security": return AlertTriangle;
            case "account": return Users;
            default: return Bell;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Channels */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                            <Bell className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Notification Channels</h2>
                            <p className="text-sm text-gray-600">Choose how you want to receive notifications</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { icon: Mail, title: "Email Notifications", description: "Receive updates via email", key: "email", color: "from-blue-500 to-cyan-500" },
                            { icon: Smartphone, title: "Push Notifications", description: "Get real-time alerts on your device", key: "push", color: "from-purple-500 to-pink-500" },
                            { icon: MessageCircle, title: "SMS Notifications", description: "Text messages for urgent alerts", key: "sms", color: "from-green-500 to-emerald-500" },
                            { icon: Calendar, title: "Weekly Digest", description: "Summary of weekly activity", key: "digest", color: "from-orange-500 to-red-500" }
                        ].map((channel, index) => (
                            <motion.div
                                key={channel.title}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-r ${channel.color}`}>
                                        <channel.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{channel.title}</h3>
                                        <p className="text-sm text-gray-600">{channel.description}</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={notificationSettings[channel.key as keyof typeof notificationSettings].enabled}
                                    onCheckedChange={(checked) => setNotificationSettings(prev => ({
                                        ...prev,
                                        [channel.key]: { ...prev[channel.key as keyof typeof prev], enabled: checked }
                                    }))}
                                />
                            </motion.div>
                        ))}
                    </div>

                    {/* Sound Settings (only for push) */}
                    {notificationSettings.push.enabled && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-6 p-5 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Volume2 className="w-5 h-5 text-gray-600" />
                                    <span className="font-semibold text-gray-900">Notification Sounds</span>
                                </div>
                                <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                            </div>
                            {soundEnabled && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <Volume2 className="w-4 h-4 text-gray-500" />
                                        <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="flex-1" />
                                        <VolumeX className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm text-gray-600 w-12">{volume[0]}%</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {["Default", "Gentle", "Alert"].map(sound => (
                                            <Button key={sound} variant="outline" size="sm" className="rounded-full text-xs">
                                                {sound}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </CardContent>
            </Card>

            {/* Notification Categories */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                            <Settings className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Notification Categories</h2>
                            <p className="text-sm text-gray-600">Choose which types of notifications you receive</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {notificationCategories.map((category, index) => (
                            <motion.div
                                key={category.title}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-r ${category.color}`}>
                                        <category.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-900">{category.title}</h3>
                                            {category.badge && (
                                                <Badge className="bg-yellow-500 text-white text-xs">{category.badge}</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">{category.description}</p>
                                    </div>
                                </div>
                                <Switch defaultChecked={category.enabled} />
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Recent Notifications</h2>
                            <p className="text-sm text-gray-600">Your latest notification history</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-3">
                        {recentNotifications.map((notification, index) => {
                            const Icon = getNotificationIcon(notification.type);
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`flex items-start gap-4 p-4 rounded-xl transition-all ${notification.read ? 'bg-gray-50' : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500'}`}
                                >
                                    <div className={`p-2 rounded-lg ${notification.read ? 'bg-gray-200' : 'bg-blue-200'}`}>
                                        <Icon className={`w-5 h-5 ${notification.read ? 'text-gray-600' : 'text-blue-600'}`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{notification.title}</p>
                                        <p className="text-sm text-gray-500">{notification.time}</p>
                                    </div>
                                    {!notification.read && (
                                        <Badge className="bg-blue-500 text-white">New</Badge>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => toast.success("Notification preferences saved!")}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Save All Preferences
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};