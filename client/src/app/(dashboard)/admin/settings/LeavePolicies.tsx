'use client';

import React, { useState } from 'react';
import { useCreateOrUpdateLeavePoliciesMutation, useInitializeLeaveBalancesMutation } from '@/state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Save, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const roles = ["ADMIN", "ACCOUNTS", "STAFF"] as const;

const defaultRow = {
  annualLeaveDays: 21,
  sickLeaveDays: 10,
  compassionateDays: 5,
  maternityDays: 90,
  paternityDays: 14,
  emergencyDays: 5,
  studyLeaveDays: null,
  unpaidLeaveAllowed: true,
  workingDaysPerWeek: 5,
  includeWeekends: false,
  excludeHolidays: true,
};

const LeavePolicies = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeRole, setActiveRole] = useState<typeof roles[number]>("ADMIN");
  const [policies, setPolicies] = useState<Record<string, any>>({
    ADMIN: { ...defaultRow },
    ACCOUNTS: { ...defaultRow },
    STAFF: { ...defaultRow },
  });

  const [savePolicies, { isLoading: isSaving }] = useCreateOrUpdateLeavePoliciesMutation();
  const [initializeBalances, { isLoading: isInitializing }] = useInitializeLeaveBalancesMutation();

  const updateField = (role: string, field: string, value: any) => {
    setPolicies((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [field]: value,
      },
    }));
  };

  const handleSavePolicies = async () => {
    try {
      const payload = {
        year,
        policies: roles.map((role) => ({
          role,
          ...policies[role],
        })),
      };

      await savePolicies(payload).unwrap();
      toast.success(`Leave policies for ${year} saved successfully`);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save policies");
    }
  };

  const handleInitializeBalances = async () => {
    try {
      const result = await initializeBalances({ year }).unwrap();

      toast.success(
          `Leave balances initialized for ${year}`,
          {
            description: `Created: ${result.summary.created} | Updated: ${result.summary.updated} | Skipped: ${result.summary.skipped}`,
          }
      );
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to initialize leave balances");
    }
  };

  const currentPolicy = policies[activeRole];

  return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
              <p className="text-gray-600 mt-1">Configure policies and initialize balances</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border">
                <Calendar className="w-5 h-5 text-gray-500" />
                <Input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-28 text-center font-semibold"
                />
              </div>
            </div>
          </div>

          <Tabs defaultValue="policies" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="policies">Leave Policies</TabsTrigger>
              <TabsTrigger value="balances">Initialize Balances</TabsTrigger>
            </TabsList>

            {/* ==================== POLICIES TAB ==================== */}
            <TabsContent value="policies">
              <Card>
                <CardHeader>
                  <CardTitle>Leave Policies by Role</CardTitle>
                  <CardDescription>
                    Define annual leave entitlements for each role. Changes apply to the selected year.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Role Tabs */}
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role) => (
                        <button
                            key={role}
                            onClick={() => setActiveRole(role)}
                            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                                activeRole === role
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                        >
                          {role}
                        </button>
                    ))}
                  </div>

                  {/* Policy Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.keys(defaultRow).map((field) => {
                      const value = currentPolicy[field];
                      const isBoolean = typeof value === "boolean";

                      return (
                          <div key={field} className="space-y-2">
                            <Label className="text-sm font-medium capitalize">
                              {field.replace(/([A-Z])/g, ' $1')}
                            </Label>
                            {isBoolean ? (
                                <div className="flex items-center gap-3">
                                  <Switch
                                      checked={value}
                                      onCheckedChange={(checked) => updateField(activeRole, field, checked)}
                                  />
                                  <span className="text-sm text-gray-600">
                              {value ? "Enabled" : "Disabled"}
                            </span>
                                </div>
                            ) : (
                                <Input
                                    type="number"
                                    value={value ?? ""}
                                    onChange={(e) => {
                                      const num = e.target.value === "" ? null : Number(e.target.value);
                                      updateField(activeRole, field, num);
                                    }}
                                    className="w-full"
                                />
                            )}
                          </div>
                      );
                    })}
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4 border-t">
                    <Button
                        onClick={handleSavePolicies}
                        disabled={isSaving}
                        size="lg"
                    >
                      {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving Policies...
                          </>
                      ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Policies for {year}
                          </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ==================== INITIALIZE BALANCES TAB ==================== */}
            <TabsContent value="balances">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Users className="w-6 h-6" />
                    Initialize Leave Balances
                  </CardTitle>
                  <CardDescription>
                    Create or update leave balances for all employees based on the current year policies.
                    This action is safe to run multiple times.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl">
                    <h3 className="font-semibold text-amber-800 mb-2">Important Note</h3>
                    <p className="text-amber-700 text-sm">
                      This will scan all users (Admin, Accounts, Staff) and ensure they have leave balances
                      for <strong>year {year}</strong> according to the saved policies.
                    </p>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                          size="lg"
                          className="w-full md:w-auto"
                          disabled={isInitializing}
                      >
                        {isInitializing ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Initializing Balances...
                            </>
                        ) : (
                            "Initialize Leave Balances for All Users"
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Initialize Leave Balances?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will create or update leave balances for every user in the system for year <strong>{year}</strong>.
                          <br /><br />
                          Existing balances will be updated with new entitlements.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleInitializeBalances}>
                          Yes, Initialize Balances
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
  );
};

export default LeavePolicies;