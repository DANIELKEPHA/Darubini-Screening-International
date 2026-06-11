import React, { useState, useEffect } from "react";
import {
    LeaveDecision,
    useCreateLeaveRequestMutation,
    useGetLeaveBalanceQuery,
    usePreviewLeaveDecisionMutation,
} from "@/state";

const LeaveRequestForm = () => {
    const [createLeave, { isLoading: isSubmitting }] =
        useCreateLeaveRequestMutation();

    const [previewLeave, { isLoading: isPreviewLoading }] =
        usePreviewLeaveDecisionMutation();

    const { data: leaveBalance, isLoading: isLoadingBalance } =
        useGetLeaveBalanceQuery();

    const [formData, setFormData] = useState({
        leaveType: "",
        otherLeaveType: "",
        startDate: "",
        endDate: "",
        reason: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [preview, setPreview] = useState<LeaveDecision | null>(null);

    const handleFieldChange = (field: string, value: string) => {
        const updated = { ...formData, [field]: value };
        setFormData(updated);
    };

    useEffect(() => {
        const runPreview = async () => {
            if (!formData.leaveType || !formData.startDate || !formData.endDate)
                return;

            try {
                const res = await previewLeave({
                    leaveType: formData.leaveType,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    reason: formData.reason,
                }).unwrap();

                setPreview(res);
                setErrors({});
            } catch (error: any) {
                setPreview(null);
                setErrors({
                    preview:
                        error.data?.message || "Unable to evaluate leave request",
                });
            }
        };

        runPreview();
    }, [
        formData.leaveType,
        formData.startDate,
        formData.endDate,
        formData.reason,
        previewLeave,
    ]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!preview) {
            setErrors({ submit: "Leave cannot be evaluated yet" });
            return;
        }

        if (!preview.allowed) {
            setErrors({
                submit: preview.reason || "Leave request not allowed",
            });
            return;
        }

        try {
            await createLeave({
                leaveType: formData.leaveType,
                otherLeaveType:
                    formData.leaveType === "OTHER"
                        ? formData.otherLeaveType
                        : undefined,
                startDate: formData.startDate,
                endDate: formData.endDate,
                reason: formData.reason,
            }).unwrap();

            setFormData({
                leaveType: "",
                otherLeaveType: "",
                startDate: "",
                endDate: "",
                reason: "",
            });

            setPreview(null);
            setErrors({});
        } catch (error: any) {
            setErrors({
                submit: error.data?.message || "Failed to submit request",
            });
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Request Leave / Off-Day
            </h2>

            {preview && (
                <div
                    className={`mb-6 p-4 rounded-lg border ${
                        preview.allowed
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                    }`}
                >
                    <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">
                            Chargeable Days:
                        </span>
                        <span className="font-semibold">
                            {preview.chargeableDays}
                        </span>
                    </div>

                    <div className="flex justify-between mt-1">
                        <span className="text-sm font-medium text-gray-700">
                            Status:
                        </span>
                        <span
                            className={
                                preview.allowed
                                    ? "text-green-600 font-semibold"
                                    : "text-red-600 font-semibold"
                            }
                        >
                            {preview.allowed
                                ? "ELIGIBLE"
                                : "NOT ELIGIBLE"}
                        </span>
                    </div>

                    {preview.reason && (
                        <p className="mt-2 text-xs text-red-600">
                            {preview.reason}
                        </p>
                    )}

                    {preview.balanceImpact && (
                        <p className="mt-2 text-xs text-gray-600">
                            Will deduct:{" "}
                            {preview.balanceImpact.daysToDeduct} days
                        </p>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type of Leave *
                    </label>

                    <select
                        value={formData.leaveType}
                        onChange={(e) =>
                            handleFieldChange("leaveType", e.target.value)
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        required
                    >
                        <option value="">Select Leave Type</option>
                        <option value="ANNUAL">Annual Leave</option>
                        <option value="SICK">Sick Leave</option>
                        <option value="EMERGENCY">Emergency Leave</option>
                        <option value="MATERNITY_PATERNITY">
                            Maternity/Paternity Leave
                        </option>
                        <option value="COMPASSIONATE">
                            Compassionate Leave
                        </option>
                        <option value="OFF_DAY">Off-Day</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>

                {/* OTHER TYPE */}
                {formData.leaveType === "OTHER" && (
                    <input
                        type="text"
                        value={formData.otherLeaveType}
                        onChange={(e) =>
                            handleFieldChange(
                                "otherLeaveType",
                                e.target.value
                            )
                        }
                        placeholder="Specify leave type"
                        className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                )}

                {/* DATES */}
                <div className="grid grid-cols-2 gap-4">
                    <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                            handleFieldChange("startDate", e.target.value)
                        }
                        className="p-3 border rounded-lg"
                        required
                    />

                    <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                            handleFieldChange("endDate", e.target.value)
                        }
                        className="p-3 border rounded-lg"
                        required
                    />
                </div>
                <textarea
                    value={formData.reason}
                    onChange={(e) =>
                        handleFieldChange("reason", e.target.value)
                    }
                    rows={4}
                    placeholder="Reason for leave"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                />
                {errors.submit && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        {errors.submit}
                    </div>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting || !preview?.allowed}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
                >
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
            </form>
        </div>
    );
};

export default LeaveRequestForm;