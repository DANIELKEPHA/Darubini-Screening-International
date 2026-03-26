"use client";
import * as React from "react";
import { useGetAuthUserQuery } from "@/state/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Loader2,
    User,
    Mail,
    Phone,
    Lock,
    Bell,
    Shield,
    Eye,
    EyeOff,
    CheckCircle,
    Save,
    Settings as SettingsIcon,
    Key,
    Smartphone,
    ShieldCheck,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settingsSchema, SettingsFormData } from "@/lib/schemas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { fetchAuthSession, updatePassword } from "aws-amplify/auth";

const AccountsSettings = () => {
    const { data: authUser, isLoading, error } = useGetAuthUserQuery(undefined, { pollingInterval: 0 });
    const router = useRouter();

    const [isChangingPassword, setIsChangingPassword] = React.useState(false);
    const [currentPassword, setCurrentPassword] = React.useState("");
    const [newPassword, setNewPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [passwordLoading, setPasswordLoading] = React.useState(false);

    // Password visibility states
    const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
    const [showNewPassword, setShowNewPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

    // Notification states
    const [emailNotifications, setEmailNotifications] = React.useState(true);
    const [pushNotifications, setPushNotifications] = React.useState(true);
    const [securityAlerts, setSecurityAlerts] = React.useState(true);

    const form = useForm<SettingsFormData>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            name: "",
            email: "",
            phoneNumber: "",
        },
    });

    React.useEffect(() => {
        if (authUser && authUser.userInfo) {
            form.reset({
                name: authUser.userInfo.name || "",
                email: authUser.userInfo.email || "",
                phoneNumber: authUser.userInfo.phoneNumber || "",
            });
        }
    }, [authUser, form]);

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }
        try {
            setPasswordLoading(true);
            await updatePassword({
                oldPassword: currentPassword,
                newPassword,
            });
            toast.success("Password changed successfully", {
                icon: <CheckCircle className="w-5 h-5 text-green-500" />,
            });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setIsChangingPassword(false);
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to change password");
        } finally {
            setPasswordLoading(false);
        }
    };

    const onSubmit = async (data: SettingsFormData) => {
        try {
            if (!authUser?.cognitoInfo?.userId) throw new Error("User ID not found");
            const session = await fetchAuthSession();
            const idToken = session.tokens?.idToken?.toString();
            if (!idToken) throw new Error("No authentication token found");

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts/${authUser.cognitoInfo.userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Failed to update settings");
            toast.success("Settings updated successfully", {
                icon: <CheckCircle className="w-5 h-5 text-green-500" />,
            });
        } catch (error: any) {
            toast.error(`Failed to update settings: ${error.message || "Unknown error"}`);
        }
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 },
        },
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100, damping: 12 },
        },
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <SettingsIcon className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-gray-600 font-medium">Loading settings...</p>
                </div>
            </div>
        );
    }

    if (error) {
        const errorMessage =
            "status" in error && error.data && typeof error.data === "object" && "message" in error.data
                ? (error.data as { message: string }).message
                : "status" in error
                    ? "Please try again"
                    : error.message || "Please try again";
        toast.error(`Failed to load user data: ${errorMessage}`);
        router.push("/signin");
        return null;
    }

    if (!authUser || authUser.userRole !== "accounts") {
        toast.error("Access denied: Accounts role required.");
        router.push("/signin");
        return null;
    }

    const NameIcon = () => <User className="text-gray-400" />;
    const EmailIcon = () => <Mail className="text-gray-400" />;
    const PhoneIcon = () => <Phone className="text-gray-400" />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="max-w-6xl mx-auto"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                            <SettingsIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
                            <p className="text-gray-600 mt-1">Manage your account preferences and security settings</p>
                        </div>
                    </div>

                    {/* User Info Card */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-sm border border-gray-200 p-6 mb-8"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-2xl font-bold text-white">
                    {authUser.userInfo?.name?.charAt(0) || "A"}
                  </span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{authUser.userInfo?.name || "Accounts User"}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {authUser.userRole || "Accounts"}
                    </span>
                                        <span className="text-gray-500 text-sm">•</span>
                                        <span className="text-gray-600 text-sm">{authUser.userInfo?.email}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-500">Last Login</div>
                                <div className="text-gray-700 font-medium">Today, 10:30 AM</div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <motion.div variants={itemVariants} className="lg:col-span-3">
                        <Tabs defaultValue="profile" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-gray-50 to-white p-1.5 rounded-2xl border border-gray-200 shadow-inner">
                                <TabsTrigger
                                    value="profile"
                                    className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-gray-200 rounded-xl"
                                >
                                    <User className="w-5 h-5 mr-2" />
                                    <span className="font-medium">Profile</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="security"
                                    className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-gray-200 rounded-xl"
                                >
                                    <Shield className="w-5 h-5 mr-2" />
                                    <span className="font-medium">Security</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="notifications"
                                    className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-gray-200 rounded-xl"
                                >
                                    <Bell className="w-5 h-5 mr-2" />
                                    <span className="font-medium">Notifications</span>
                                </TabsTrigger>
                            </TabsList>

                            {/* Profile Tab */}
                            <TabsContent value="profile" className="mt-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Card className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-lg rounded-2xl overflow-hidden">
                                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <User className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
                                                    <p className="text-sm text-gray-600">Update your personal details and contact information</p>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-8">
                                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <Label htmlFor="name" className="text-gray-700 font-medium mb-2 block">
                                                                <div className="flex items-center gap-2">
                                                                    <User className="w-4 h-4" /> Full Name
                                                                </div>
                                                            </Label>
                                                            <Input
                                                                id="name"
                                                                className="h-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all"
                                                                prefixElement={
                                                                    <div className="pl-3">
                                                                        <NameIcon />
                                                                    </div>
                                                                }
                                                                {...form.register("name")}
                                                            />
                                                            {form.formState.errors.name && (
                                                                <p className="text-sm text-red-500 mt-2">{form.formState.errors.name.message}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <Label htmlFor="email" className="text-gray-700 font-medium mb-2 block">
                                                                <div className="flex items-center gap-2">
                                                                    <Mail className="w-4 h-4" /> Email Address
                                                                </div>
                                                            </Label>
                                                            <Input
                                                                id="email"
                                                                type="email"
                                                                className="h-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all"
                                                                prefixElement={
                                                                    <div className="pl-3">
                                                                        <EmailIcon />
                                                                    </div>
                                                                }
                                                                {...form.register("email")}
                                                            />
                                                            {form.formState.errors.email && (
                                                                <p className="text-sm text-red-500 mt-2">{form.formState.errors.email.message}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <Label htmlFor="phoneNumber" className="text-gray-700 font-medium mb-2 block">
                                                            <div className="flex items-center gap-2">
                                                                <Phone className="w-4 h-4" /> Phone Number
                                                            </div>
                                                        </Label>
                                                        <Input
                                                            id="phoneNumber"
                                                            className="h-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all"
                                                            prefixElement={
                                                                <div className="pl-3">
                                                                    <PhoneIcon />
                                                                </div>
                                                            }
                                                            {...form.register("phoneNumber")}
                                                        />
                                                        {form.formState.errors.phoneNumber && (
                                                            <p className="text-sm text-red-500 mt-2">
                                                                {form.formState.errors.phoneNumber.message}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex justify-end pt-4 border-t border-gray-200">
                                                    <Button
                                                        type="submit"
                                                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
                                                    >
                                                        <Save className="w-5 h-5 mr-2" /> Save Changes
                                                    </Button>
                                                </div>
                                            </form>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </TabsContent>

                            {/* Security Tab */}
                            <TabsContent value="security" className="mt-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Card className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-lg rounded-2xl overflow-hidden">
                                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-red-100 rounded-lg">
                                                    <Shield className="w-6 h-6 text-red-600" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-900">Security Settings</h2>
                                                    <p className="text-sm text-gray-600">Manage your account security and password</p>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-8">
                                            <div className="space-y-6">
                                                {/* Password Change Section */}
                                                <div className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-2xl p-6">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-gradient-to-r from-red-100 to-red-50 rounded-xl">
                                                                <Key className="w-6 h-6 text-red-600" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-gray-900">Password Settings</h3>
                                                                <p className="text-sm text-gray-600">Change your account password</p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant={isChangingPassword ? "outline" : "default"}
                                                            onClick={() => setIsChangingPassword((prev) => !prev)}
                                                            className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white rounded-xl font-medium"
                                                        >
                                                            {isChangingPassword ? "Cancel" : "Change Password"}
                                                        </Button>
                                                    </div>

                                                    {isChangingPassword && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            transition={{ duration: 0.3 }}
                                                            className="pt-6 border-t border-gray-200"
                                                        >
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <Label className="text-gray-700 font-medium mb-2 block">Current Password</Label>
                                                                        <div className="relative">
                                                                            <Input
                                                                                type={showCurrentPassword ? "text" : "password"}
                                                                                value={currentPassword}
                                                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                                                className="h-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl pr-12"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                                            >
                                                                                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <Label className="text-gray-700 font-medium mb-2 block">New Password</Label>
                                                                        <div className="relative">
                                                                            <Input
                                                                                type={showNewPassword ? "text" : "password"}
                                                                                value={newPassword}
                                                                                onChange={(e) => setNewPassword(e.target.value)}
                                                                                className="h-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl pr-12"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                                            >
                                                                                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <Label className="text-gray-700 font-medium mb-2 block">Confirm New Password</Label>
                                                                        <div className="relative">
                                                                            <Input
                                                                                type={showConfirmPassword ? "text" : "password"}
                                                                                value={confirmPassword}
                                                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                                                className="h-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl pr-12"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                                            >
                                                                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Password Strength Meter */}
                                                                <div className="space-y-4">
                                                                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-5">
                                                                        <h4 className="font-bold text-gray-900 mb-3">Password Requirements</h4>
                                                                        <ul className="space-y-2 text-sm">
                                                                            <li className={`flex items-center gap-2 ${newPassword.length >= 8 ? "text-green-600" : "text-gray-500"}`}>
                                                                                <div className={`w-2 h-2 rounded-full ${newPassword.length >= 8 ? "bg-green-500" : "bg-gray-300"}`}></div>
                                                                                At least 8 characters
                                                                            </li>
                                                                            <li className={`flex items-center gap-2 ${/[A-Z]/.test(newPassword) ? "text-green-600" : "text-gray-500"}`}>
                                                                                <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(newPassword) ? "bg-green-500" : "bg-gray-300"}`}></div>
                                                                                One uppercase letter
                                                                            </li>
                                                                            <li className={`flex items-center gap-2 ${/[0-9]/.test(newPassword) ? "text-green-600" : "text-gray-500"}`}>
                                                                                <div className={`w-2 h-2 rounded-full ${/[0-9]/.test(newPassword) ? "bg-green-500" : "bg-gray-300"}`}></div>
                                                                                One number
                                                                            </li>
                                                                            <li className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(newPassword) ? "text-green-600" : "text-gray-500"}`}>
                                                                                <div className={`w-2 h-2 rounded-full ${/[^A-Za-z0-9]/.test(newPassword) ? "bg-green-500" : "bg-gray-300"}`}></div>
                                                                                One special character
                                                                            </li>
                                                                        </ul>
                                                                    </div>

                                                                    <div className="flex justify-end gap-3 pt-4">
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={() => setIsChangingPassword(false)}
                                                                            className="border-gray-300 hover:bg-gray-50 rounded-xl"
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                        <Button
                                                                            onClick={handleChangePassword}
                                                                            disabled={passwordLoading || !currentPassword || !newPassword || newPassword !== confirmPassword}
                                                                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-medium px-6"
                                                                        >
                                                                            {passwordLoading ? (
                                                                                <>
                                                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <CheckCircle className="w-5 h-5 mr-2" /> Update Password
                                                                                </>
                                                                            )}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>

                                                {/* Security Options */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-2xl">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-2.5 bg-purple-100 rounded-lg">
                                                                <Smartphone className="w-5 h-5 text-purple-600" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-gray-900">Two-Factor Authentication</h3>
                                                                <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                                                            </div>
                                                        </div>
                                                        <Switch className="data-[state=checked]:bg-green-600" />
                                                    </div>

                                                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-2xl">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-2.5 bg-yellow-100 rounded-lg">
                                                                <ShieldCheck className="w-5 h-5 text-yellow-600" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-gray-900">Session Management</h3>
                                                                <p className="text-sm text-gray-600">Manage and review active sessions</p>
                                                            </div>
                                                        </div>
                                                        <Button variant="outline" className="rounded-xl">
                                                            Manage
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </TabsContent>

                            {/* Notifications Tab */}
                            <TabsContent value="notifications" className="mt-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Card className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-lg rounded-2xl overflow-hidden">
                                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-100 rounded-lg">
                                                    <Bell className="w-6 h-6 text-green-600" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
                                                    <p className="text-sm text-gray-600">Configure how you receive notifications and alerts</p>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-8">
                                            <div className="space-y-6">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-2xl hover:shadow-sm transition-shadow">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-2.5 bg-blue-100 rounded-lg">
                                                                <Mail className="w-5 h-5 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-gray-900">Email Notifications</h3>
                                                                <p className="text-sm text-gray-600">Receive important updates via email</p>
                                                            </div>
                                                        </div>
                                                        <Switch
                                                            checked={emailNotifications}
                                                            onCheckedChange={setEmailNotifications}
                                                            className="data-[state=checked]:bg-blue-600"
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-2xl hover:shadow-sm transition-shadow">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-2.5 bg-purple-100 rounded-lg">
                                                                <Smartphone className="w-5 h-5 text-purple-600" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-gray-900">Push Notifications</h3>
                                                                <p className="text-sm text-gray-600">Get alerts on your mobile device</p>
                                                            </div>
                                                        </div>
                                                        <Switch
                                                            checked={pushNotifications}
                                                            onCheckedChange={setPushNotifications}
                                                            className="data-[state=checked]:bg-purple-600"
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-2xl hover:shadow-sm transition-shadow">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-2.5 bg-red-100 rounded-lg">
                                                                <Shield className="w-5 h-5 text-red-600" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-gray-900">Security Alerts</h3>
                                                                <p className="text-sm text-gray-600">Receive alerts for security events</p>
                                                            </div>
                                                        </div>
                                                        <Switch
                                                            checked={securityAlerts}
                                                            onCheckedChange={setSecurityAlerts}
                                                            className="data-[state=checked]:bg-red-600"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="pt-6 border-t border-gray-200">
                                                    <div className="flex justify-end">
                                                        <Button
                                                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
                                                            onClick={() => {
                                                                toast.success("Notification preferences saved!", {
                                                                    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
                                                                });
                                                            }}
                                                        >
                                                            <Save className="w-5 h-5 mr-2" /> Save Preferences
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default AccountsSettings;