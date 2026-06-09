'use client';

import React, { useState } from 'react';
import { useCreateOrUpdateLeavePoliciesMutation } from '@/state';

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

const LeavePolicy = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeRole, setActiveRole] = useState<typeof roles[number]>("ADMIN");

  const [policies, setPolicies] = useState<Record<string, any>>({
    ADMIN: { ...defaultRow },
    ACCOUNTS: { ...defaultRow },
    STAFF: { ...defaultRow },
  });

  const [savePolicies, { isLoading }] = useCreateOrUpdateLeavePoliciesMutation();

  const updateField = (role: string, field: string, value: any) => {
    setPolicies((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    const payload = {
      year,
      policies: roles.map((role) => ({
        role,
        ...policies[role],
      })),
    };

    await savePolicies(payload);
  };

  const current = policies[activeRole];

  return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm p-6">

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold">Leave Policy Setup</h1>

            <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="border px-3 py-1 rounded-md w-32"
            />
          </div>

          {/* Role Tabs */}
          <div className="flex gap-2 mb-6">
            {roles.map((role) => (
                <button
                    key={role}
                    onClick={() => setActiveRole(role)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                        activeRole === role
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600"
                    }`}
                >
                  {role}
                </button>
            ))}
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

            {Object.keys(defaultRow).map((field) => (
                <div key={field}>
                  <label className="text-xs text-gray-500 capitalize">
                    {field.replace(/([A-Z])/g, ' $1')}
                  </label>

                  {typeof current[field] === "boolean" ? (
                      <select
                          value={String(current[field])}
                          onChange={(e) =>
                              updateField(activeRole, field, e.target.value === "true")
                          }
                          className="w-full border px-2 py-1 rounded-md"
                      >
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                  ) : (
                      <input
                          type="number"
                          value={current[field] ?? ""}
                          onChange={(e) =>
                              updateField(activeRole, field, Number(e.target.value))
                          }
                          className="w-full border px-2 py-1 rounded-md"
                      />
                  )}
                </div>
            ))}

          </div>

          {/* Save */}
          <div className="mt-6 flex justify-end">
            <button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
            >
              {isLoading ? "Saving..." : "Save Policies"}
            </button>
          </div>

        </div>
      </div>
  );
};

export default LeavePolicy;