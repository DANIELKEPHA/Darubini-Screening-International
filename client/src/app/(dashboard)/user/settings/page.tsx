"use client";

import { useGetAuthUserQuery, useUpdateUserSettingsMutation } from "@/state/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {Loader2, User, Mail, Phone, Lock, Bell, Shield, MailIcon} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settingsSchema, SettingsFormData } from "@/lib/schemas";
import { toast } from "sonner";
import React from "react";

const TenantSettings = () => {
  const { data: authUser, isLoading } = useGetAuthUserQuery();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserSettingsMutation();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
    },
  });

  React.useEffect(() => {
    if (authUser) {
      form.reset({
        name: authUser.userInfo.name,
        email: authUser.userInfo.email,
        phoneNumber: authUser.userInfo.phoneNumber || "",
      });
    }
  }, [authUser, form]);

  const onSubmit = async (data: SettingsFormData) => {
    try {
      await updateUser({
        cognitoId: authUser?.cognitoInfo?.userId,
        ...data,
      }).unwrap();
      toast.success("Settings updated successfully");
    } catch (error) {
      toast.error("Failed to update settings");
    }
  };

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  // Create icon components separately to satisfy TypeScript
  const NameIcon = () => <User className="text-muted-foreground" />;
  const EmailIcon = () => <Mail className="text-muted-foreground" />;
  const PhoneIcon = () => <Phone className="text-muted-foreground" />;

  return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and security</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Profile Information</h2>
                <p className="text-sm text-muted-foreground">
                  Update your personal details
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                          id="name"
                          prefixElement={<NameIcon />}
                          {...form.register("name")}
                          disabled={isUpdating}
                      />

                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                          id="email"
                          prefixElement={<MailIcon />}
                          {...form.register("email")}
                          disabled={isUpdating}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                          id="phoneNumber"
                          prefixElement={<PhoneIcon />}
                          {...form.register("phoneNumber")}
                          disabled={isUpdating}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Security Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your account security
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-medium">Password</h3>
                        <p className="text-sm text-muted-foreground">
                          Last changed 3 months ago
                        </p>
                      </div>
                    </div>
                    <Button variant="outline">Change Password</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Lock className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-medium">Two-Factor Authentication</h3>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security
                        </p>
                      </div>
                    </div>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Notification Preferences</h2>
                <p className="text-sm text-muted-foreground">
                  Configure how you receive notifications
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive important updates via email
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="email-notifications">Enable</Label>
                      <Input
                          type="checkbox"
                          id="email-notifications"
                          className="w-5 h-5"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Push Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Get alerts on your mobile device
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="push-notifications">Enable</Label>
                      <Input
                          type="checkbox"
                          id="push-notifications"
                          className="w-5 h-5"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button>Save Preferences</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default TenantSettings;