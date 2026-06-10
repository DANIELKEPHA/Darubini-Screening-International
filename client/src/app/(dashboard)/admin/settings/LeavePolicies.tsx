'use client';

import React, { useState, useEffect } from 'react';
import {
  useCreateOrUpdateLeavePoliciesMutation,
  useInitializeLeaveBalancesMutation,
  useGetLeavePoliciesByYearQuery,
  useGetLeavePolicyQuery,
  useUpdateLeavePolicyMutation,
  useDeleteLeavePolicyMutation
} from '@/state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Save, Users, Calendar, Trash2, Edit, Download, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

type UserRole = "admin" | "user" | "accounts" | "staff";
const roles: UserRole[] = ["admin", "accounts", "staff"];

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
  const [activeRole, setActiveRole] = useState<UserRole>("admin");
  const [policies, setPolicies] = useState<Record<string, any>>({
    admin: { ...defaultRow },
    accounts: { ...defaultRow },
    staff: { ...defaultRow },
  });
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: allPoliciesData,
    isLoading: isLoadingPolicies,
    refetch: refetchAllPolicies
  } = useGetLeavePoliciesByYearQuery(year, {
    skip: !year,
  });

  const {
    data: singlePolicyData,
    isLoading: isLoadingSinglePolicy,
    refetch: refetchSinglePolicy
  } = useGetLeavePolicyQuery(
      { year, role: activeRole },
      { skip: !year || !activeRole }
  );

  const [savePolicies, { isLoading: isSaving }] = useCreateOrUpdateLeavePoliciesMutation();
  const [initializeBalances, { isLoading: isInitializing }] = useInitializeLeaveBalancesMutation();
  const [updatePolicy, { isLoading: isUpdating }] = useUpdateLeavePolicyMutation();
  const [deletePolicy, { isLoading: isDeleting }] = useDeleteLeavePolicyMutation();

  // Load existing policies when data is fetched
  useEffect(() => {
    if (allPoliciesData?.policies) {
      const loadedPolicies: Record<string, any> = {};
      allPoliciesData.policies.forEach((policy: any) => {
        // Convert role to lowercase when storing in state
        const roleKey = policy.role.toLowerCase();
        loadedPolicies[roleKey] = {
          annualLeaveDays: policy.annualLeaveDays ?? defaultRow.annualLeaveDays,
          sickLeaveDays: policy.sickLeaveDays ?? defaultRow.sickLeaveDays,
          compassionateDays: policy.compassionateDays ?? defaultRow.compassionateDays,
          maternityDays: policy.maternityDays ?? defaultRow.maternityDays,
          paternityDays: policy.paternityDays ?? defaultRow.paternityDays,
          emergencyDays: policy.emergencyDays ?? defaultRow.emergencyDays,
          studyLeaveDays: policy.studyLeaveDays ?? defaultRow.studyLeaveDays,
          unpaidLeaveAllowed: policy.unpaidLeaveAllowed ?? defaultRow.unpaidLeaveAllowed,
          workingDaysPerWeek: policy.workingDaysPerWeek ?? defaultRow.workingDaysPerWeek,
          includeWeekends: policy.includeWeekends ?? defaultRow.includeWeekends,
          excludeHolidays: policy.excludeHolidays ?? defaultRow.excludeHolidays,
        };
      });

      roles.forEach(role => {
        if (!loadedPolicies[role]) {
          loadedPolicies[role] = { ...defaultRow };
        }
      });

      setPolicies(loadedPolicies);
    }
  }, [allPoliciesData]);

  // Load single policy when role changes
  useEffect(() => {
    if (singlePolicyData?.policy) {
      const policy = singlePolicyData.policy;
      setPolicies(prev => ({
        ...prev,
        [activeRole]: {
          annualLeaveDays: policy.annualLeaveDays ?? defaultRow.annualLeaveDays,
          sickLeaveDays: policy.sickLeaveDays ?? defaultRow.sickLeaveDays,
          compassionateDays: policy.compassionateDays ?? defaultRow.compassionateDays,
          maternityDays: policy.maternityDays ?? defaultRow.maternityDays,
          paternityDays: policy.paternityDays ?? defaultRow.paternityDays,
          emergencyDays: policy.emergencyDays ?? defaultRow.emergencyDays,
          studyLeaveDays: policy.studyLeaveDays ?? defaultRow.studyLeaveDays,
          unpaidLeaveAllowed: policy.unpaidLeaveAllowed ?? defaultRow.unpaidLeaveAllowed,
          workingDaysPerWeek: policy.workingDaysPerWeek ?? defaultRow.workingDaysPerWeek,
          includeWeekends: policy.includeWeekends ?? defaultRow.includeWeekends,
          excludeHolidays: policy.excludeHolidays ?? defaultRow.excludeHolidays,
        }
      }));
    }
  }, [singlePolicyData, activeRole]);

  const updateField = (role: UserRole, field: string, value: any) => {
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
          role: role.toUpperCase(), // Send role in UPPERCASE to match backend
          ...policies[role],
        })),
      };

      await savePolicies(payload).unwrap();
      toast.success(`Leave policies for ${year} saved successfully`);
      setIsEditing(false);
      refetchAllPolicies();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save policies");
    }
  };

  const handleUpdateSinglePolicy = async () => {
    try {
      const currentPolicy = policies[activeRole];
      await updatePolicy({
        year,
        role: activeRole, // This will be lowercase, but your API might expect uppercase
        data: currentPolicy
      }).unwrap();
      toast.success(`${activeRole.toUpperCase()} policy updated successfully`);
      setIsEditing(false);
      refetchSinglePolicy();
      refetchAllPolicies();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update policy");
    }
  };

  const handleDeletePolicy = async () => {
    try {
      await deletePolicy({
        year,
        role: activeRole // This will be lowercase, but your API might expect uppercase
      }).unwrap();
      toast.success(`${activeRole.toUpperCase()} policy deleted successfully`);
      updateField(activeRole, 'annualLeaveDays', defaultRow.annualLeaveDays);
      updateField(activeRole, 'sickLeaveDays', defaultRow.sickLeaveDays);
      updateField(activeRole, 'compassionateDays', defaultRow.compassionateDays);
      updateField(activeRole, 'maternityDays', defaultRow.maternityDays);
      updateField(activeRole, 'paternityDays', defaultRow.paternityDays);
      updateField(activeRole, 'emergencyDays', defaultRow.emergencyDays);
      updateField(activeRole, 'studyLeaveDays', defaultRow.studyLeaveDays);
      updateField(activeRole, 'unpaidLeaveAllowed', defaultRow.unpaidLeaveAllowed);
      updateField(activeRole, 'workingDaysPerWeek', defaultRow.workingDaysPerWeek);
      updateField(activeRole, 'includeWeekends', defaultRow.includeWeekends);
      updateField(activeRole, 'excludeHolidays', defaultRow.excludeHolidays);
      refetchAllPolicies();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete policy");
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

  const exportPolicies = () => {
    const dataStr = JSON.stringify(policies, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `leave-policies-${year}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importPolicies = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setPolicies(prev => ({
            ...prev,
            ...imported
          }));
          toast.success("Policies imported successfully");
        } catch (error) {
          toast.error("Failed to parse imported file");
        }
      };
      reader.readAsText(file);
    }
  };

  const currentPolicy = policies[activeRole];
  // FIX: Convert both to lowercase for comparison
  const hasExistingPolicy = allPoliciesData?.policies?.some(
      p => p.role.toLowerCase() === activeRole
  );

  const formatRoleName = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
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
                    onChange={(e) => {
                      setYear(Number(e.target.value));
                      setIsEditing(false);
                    }}
                    className="w-28 text-center font-semibold"
                />
              </div>
              <Button variant="outline" onClick={exportPolicies} size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <label>
                <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </span>
                </Button>
                <input type="file" accept=".json" onChange={importPolicies} className="hidden" />
              </label>
            </div>
          </div>

          <Tabs defaultValue="policies" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="policies">Leave Policies</TabsTrigger>
              <TabsTrigger value="balances">Initialize Balances</TabsTrigger>
            </TabsList>

            <TabsContent value="policies">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Leave Policies by Role</CardTitle>
                      <CardDescription>
                        Define annual leave entitlements for each role. Changes apply to the selected year.
                      </CardDescription>
                    </div>
                    {isLoadingPolicies && (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-wrap gap-2 justify-between items-center">
                    <div className="flex flex-wrap gap-2">
                      {roles.map((role) => (
                          <button
                              key={role}
                              onClick={() => {
                                setActiveRole(role);
                                setIsEditing(false);
                              }}
                              className={`px-6 py-2.5 rounded-lg font-medium transition-all relative ${
                                  activeRole === role
                                      ? "bg-blue-600 text-white shadow-sm"
                                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                              }`}
                          >
                            {formatRoleName(role)}
                            {/* FIX: Convert to lowercase for comparison */}
                            {allPoliciesData?.policies?.some(p => p.role.toLowerCase() === role) && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                            )}
                          </button>
                      ))}
                    </div>

                    {hasExistingPolicy && !isEditing && (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Policy
                        </Button>
                    )}
                  </div>

                  {isLoadingSinglePolicy && (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                      </div>
                  )}

                  {!isLoadingSinglePolicy && (
                      <>
                        {hasExistingPolicy && !isEditing && (
                            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                              <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-green-800">
                                    Existing Policy Loaded
                                  </p>
                                  <p className="text-sm text-green-700">
                                    A policy for {formatRoleName(activeRole)} already exists for {year}.
                                    Click Edit to modify or delete it.
                                  </p>
                                </div>
                              </div>
                            </div>
                        )}

                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${!isEditing && hasExistingPolicy ? 'opacity-75' : ''}`}>
                          {Object.keys(defaultRow).map((field) => {
                            const value = currentPolicy[field];
                            const isBoolean = typeof value === "boolean";
                            const isReadOnly = hasExistingPolicy && !isEditing;

                            return (
                                <div key={field} className="space-y-2">
                                  <Label className="text-sm font-medium capitalize">
                                    {field.replace(/([A-Z])/g, ' $1')}
                                  </Label>
                                  {isBoolean ? (
                                      <div className="flex items-center gap-3">
                                        <Switch
                                            checked={value}
                                            onCheckedChange={(checked) => !isReadOnly && updateField(activeRole, field, checked)}
                                            disabled={isReadOnly}
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
                                            if (!isReadOnly) updateField(activeRole, field, num);
                                          }}
                                          className="w-full"
                                          disabled={isReadOnly}
                                      />
                                  )}
                                </div>
                            );
                          })}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                          {isEditing || !hasExistingPolicy ? (
                              <>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsEditing(false);
                                      if (singlePolicyData?.policy) {
                                        const policy = singlePolicyData.policy;
                                        updateField(activeRole, 'annualLeaveDays', policy.annualLeaveDays ?? defaultRow.annualLeaveDays);
                                        updateField(activeRole, 'sickLeaveDays', policy.sickLeaveDays ?? defaultRow.sickLeaveDays);
                                        updateField(activeRole, 'compassionateDays', policy.compassionateDays ?? defaultRow.compassionateDays);
                                        updateField(activeRole, 'maternityDays', policy.maternityDays ?? defaultRow.maternityDays);
                                        updateField(activeRole, 'paternityDays', policy.paternityDays ?? defaultRow.paternityDays);
                                        updateField(activeRole, 'emergencyDays', policy.emergencyDays ?? defaultRow.emergencyDays);
                                        updateField(activeRole, 'studyLeaveDays', policy.studyLeaveDays ?? defaultRow.studyLeaveDays);
                                        updateField(activeRole, 'unpaidLeaveAllowed', policy.unpaidLeaveAllowed ?? defaultRow.unpaidLeaveAllowed);
                                        updateField(activeRole, 'workingDaysPerWeek', policy.workingDaysPerWeek ?? defaultRow.workingDaysPerWeek);
                                        updateField(activeRole, 'includeWeekends', policy.includeWeekends ?? defaultRow.includeWeekends);
                                        updateField(activeRole, 'excludeHolidays', policy.excludeHolidays ?? defaultRow.excludeHolidays);
                                      } else {
                                        updateField(activeRole, 'annualLeaveDays', defaultRow.annualLeaveDays);
                                      }
                                    }}
                                >
                                  Cancel
                                </Button>

                                <Button
                                    onClick={hasExistingPolicy ? handleUpdateSinglePolicy : handleSavePolicies}
                                    disabled={isSaving || isUpdating}
                                >
                                  {(isSaving || isUpdating) ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {hasExistingPolicy ? "Updating..." : "Saving..."}
                                      </>
                                  ) : (
                                      <>
                                        <Save className="mr-2 h-4 w-4" />
                                        {hasExistingPolicy ? `Update ${formatRoleName(activeRole)} Policy` : `Save ${formatRoleName(activeRole)} Policy`}
                                      </>
                                  )}
                                </Button>

                                {hasExistingPolicy && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="destructive" disabled={isDeleting}>
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Policy?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete the {formatRoleName(activeRole)} policy for {year}?
                                            This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={handleDeletePolicy}>
                                            Yes, Delete Policy
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                )}
                              </>
                          ) : (
                              hasExistingPolicy && (
                                  <Button onClick={handleSavePolicies} disabled={isSaving} size="lg">
                                    {isSaving ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Saving All Policies...
                                        </>
                                    ) : (
                                        <>
                                          <Save className="mr-2 h-4 w-4" />
                                          Save All Policies for {year}
                                        </>
                                    )}
                                  </Button>
                              )
                          )}
                        </div>
                      </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

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
                      <Button size="lg" className="w-full md:w-auto" disabled={isInitializing}>
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