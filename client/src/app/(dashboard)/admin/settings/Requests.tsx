"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield,
    Key,
    Fingerprint,
    Smartphone,
    Globe,
    AlertTriangle,
    CheckCircle,
    Eye,
    EyeOff,
    Loader2,
    ShieldCheck,
    History,
    LogOut,
    Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { updatePassword } from "aws-amplify/auth";

interface SecurityPageProps {
    authUser: any;
}

export const SecurityPage = ({ authUser }: SecurityPageProps) => {
    const [isChangingPassword, setIsChangingPassword] = React.useState(false);
    const [currentPassword, setCurrentPassword] = React.useState("");
    const [newPassword, setNewPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [passwordLoading, setPasswordLoading] = React.useState(false);
    const [showPasswords, setShowPasswords] = React.useState({ current: false, new: false, confirm: false });
    const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);
    const [biometricsEnabled, setBiometricsEnabled] = React.useState(true);

    const passwordStrength = React.useMemo(() => {
        let strength = 0;
        if (newPassword.length >= 8) strength++;
        if (/[A-Z]/.test(newPassword)) strength++;
        if (/[0-9]/.test(newPassword)) strength++;
        if (/[^A-Za-z0-9]/.test(newPassword)) strength++;
        return strength;
    }, [newPassword]);

    const getStrengthColor = () => {
        const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];
        return colors[passwordStrength - 1] || "bg-gray-300";
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }
        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        try {
            setPasswordLoading(true);
            await updatePassword({ oldPassword: currentPassword, newPassword });
            toast.success("Password updated successfully!");
            setIsChangingPassword(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            toast.error(err.message || "Failed to update password");
        } finally {
            setPasswordLoading(false);
        }
    };

    const securityFeatures = [
        {
            icon: Fingerprint,
            title: "Biometric Authentication",
            description: "Use fingerprint or face recognition",
            enabled: biometricsEnabled,
            onToggle: setBiometricsEnabled,
            color: "from-purple-500 to-pink-500"
        },
        {
            icon: ShieldCheck,
            title: "Two-Factor Authentication",
            description: "Add an extra layer of security",
            enabled: twoFactorEnabled,
            onToggle: setTwoFactorEnabled,
            color: "from-blue-500 to-cyan-500"
        },
        {
            icon: Globe,
            title: "Trusted Devices",
            description: "Manage devices that can access your account",
            enabled: true,
            action: true,
            color: "from-green-500 to-emerald-500"
        }
    ];

    const recentSessions = [
        { device: "Chrome on Windows", location: "San Francisco, CA", ip: "192.168.1.1", lastActive: "Now", current: true },
        { device: "Safari on iPhone", location: "San Francisco, CA", ip: "192.168.1.2", lastActive: "2 hours ago", current: false },
        { device: "Firefox on MacBook", location: "New York, NY", ip: "192.168.1.3", lastActive: "2 days ago", current: false },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Security Score Card */}
            <Card className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-600 text-white overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Security Score</h3>
                            <p className="text-4xl font-bold">92/100</p>
                            <p className="text-white/80 text-sm mt-2">Your account is well protected</p>
                        </div>
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-4 border-white/30 flex items-center justify-center">
                                <Shield className="w-10 h-10" />
                            </div>
                            <div className="absolute inset-0 rounded-full border-4 border-white border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Password Change Section */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl">
                                <Key className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Password & Security</h2>
                                <p className="text-sm text-gray-600">Manage your password and security preferences</p>
                            </div>
                        </div>
                        <Button
                            variant={isChangingPassword ? "outline" : "default"}
                            onClick={() => setIsChangingPassword(!isChangingPassword)}
                            className="bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-900 hover:to-black"
                        >
                            {isChangingPassword ? "Cancel" : "Change Password"}
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    <AnimatePresence>
                        {isChangingPassword && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        {[
                                            { label: "Current Password", value: currentPassword, setter: setCurrentPassword, key: "current" },
                                            { label: "New Password", value: newPassword, setter: setNewPassword, key: "new" },
                                            { label: "Confirm New Password", value: confirmPassword, setter: setConfirmPassword, key: "confirm" }
                                        ].map((field) => (
                                            <div key={field.key}>
                                                <Label className="text-gray-700 font-semibold mb-2 block">{field.label}</Label>
                                                <div className="relative">
                                                    <Input
                                                        type={showPasswords[field.key as keyof typeof showPasswords] ? "text" : "password"}
                                                        value={field.value}
                                                        onChange={(e) => field.setter(e.target.value)}
                                                        className="h-12 pr-12 bg-gray-50 border-gray-200 focus:border-violet-500 rounded-xl"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPasswords(prev => ({ ...prev, [field.key]: !prev[field.key as keyof typeof prev] }))}
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                    >
                                                        {showPasswords[field.key as keyof typeof showPasswords] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-xl p-5">
                                            <h4 className="font-bold text-gray-900 mb-3">Password Strength</h4>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                                                <div className={`h-full ${getStrengthColor()} transition-all duration-300`} style={{ width: `${(passwordStrength / 4) * 100}%` }} />
                                            </div>
                                            <ul className="space-y-2 text-sm">
                                                {[
                                                    { text: "At least 8 characters", test: newPassword.length >= 8 },
                                                    { text: "One uppercase letter", test: /[A-Z]/.test(newPassword) },
                                                    { text: "One number", test: /[0-9]/.test(newPassword) },
                                                    { text: "One special character", test: /[^A-Za-z0-9]/.test(newPassword) }
                                                ].map((req, i) => (
                                                    <li key={i} className={`flex items-center gap-2 ${req.test ? 'text-green-600' : 'text-gray-500'}`}>
                                                        {req.test ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />}
                                                        {req.text}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <Button
                                            onClick={handleChangePassword}
                                            disabled={passwordLoading || !currentPassword || !newPassword || newPassword !== confirmPassword}
                                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                        >
                                            {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5 mr-2" />}
                                            Update Password
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Security Features */}
                    <div className="space-y-4 mt-6">
                        {securityFeatures.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-r ${feature.color}`}>
                                        <feature.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                                        <p className="text-sm text-gray-600">{feature.description}</p>
                                    </div>
                                </div>
                                {feature.action ? (
                                    <Button variant="outline" className="rounded-xl">Manage</Button>
                                ) : (
                                    <Switch checked={feature.enabled} onCheckedChange={feature.onToggle} />
                                )}
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                            <History className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Active Sessions</h2>
                            <p className="text-sm text-gray-600">Manage devices where you&#39;re logged in</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {recentSessions.map((session, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-4 rounded-xl bg-gray-50"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white rounded-lg">
                                        <Smartphone className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{session.device}</p>
                                        <p className="text-sm text-gray-500">{session.location} • {session.ip}</p>
                                        <p className="text-xs text-gray-400">Last active: {session.lastActive}</p>
                                    </div>
                                </div>
                                {session.current ? (
                                    <Badge className="bg-green-500">Current Session</Badge>
                                ) : (
                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                        <LogOut className="w-4 h-4 mr-1" />
                                        Revoke
                                    </Button>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};