'use client';

import React, { useState, useEffect } from 'react';
import { X, Info, Calendar, Clock, AlertCircle } from 'lucide-react';
import { LeaveType, useCreateLeaveRequestMutation, useGetLeaveBalanceQuery } from "@/state";

interface LeaveRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LeaveRequestModal = ({ isOpen, onClose }: LeaveRequestModalProps) => {
    const [createLeave, { isLoading }] = useCreateLeaveRequestMutation();
    const { data: balance } = useGetLeaveBalanceQuery();

    const [formData, setFormData] = useState({
        leaveType: '' as LeaveType | '',
        otherLeaveType: '',
        startDate: '',
        endDate: '',
        reason: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData({
                leaveType: '',
                otherLeaveType: '',
                startDate: '',
                endDate: '',
                reason: '',
            });
            setErrors({});
        }
    }, [isOpen]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.leaveType) newErrors.leaveType = 'Select leave type';
        if (formData.leaveType === 'OTHER' && !formData.otherLeaveType) {
            newErrors.otherLeaveType = 'Specify leave type';
        }
        if (!formData.startDate) newErrors.startDate = 'Start date required';
        if (!formData.endDate) newErrors.endDate = 'End date required';
        if (!formData.reason?.trim()) newErrors.reason = 'Reason required';

        if (formData.startDate && formData.endDate) {
            if (new Date(formData.startDate) > new Date(formData.endDate)) {
                newErrors.endDate = 'End date cannot be before start date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            await createLeave({
                leaveType: formData.leaveType as LeaveType,
                otherLeaveType:
                    formData.leaveType === 'OTHER'
                        ? formData.otherLeaveType
                        : undefined,
                startDate: formData.startDate,
                endDate: formData.endDate,
                reason: formData.reason,
            }).unwrap();

            onClose();
        } catch (error: any) {
            setErrors({
                submit: error.data?.message || "Failed to submit request"
            });
        }
    };

    const getBalance = (type: LeaveType) => {
        if (!balance) return null;

        switch (type) {
            case LeaveType.ANNUAL:
                return {
                    entitled: balance.annualEntitled,
                    used: balance.annualUsed,
                    remaining: balance.annualRemaining,
                };
            case LeaveType.SICK:
                return {
                    entitled: balance.sickEntitled,
                    used: balance.sickUsed,
                    remaining: balance.sickRemaining,
                };
            case LeaveType.COMPASSIONATE:
                return {
                    entitled: balance.compassionateEntitled,
                    used: balance.compassionateUsed,
                    remaining: balance.compassionateRemaining,
                };
            case LeaveType.EMERGENCY:
                return {
                    entitled: balance.emergencyEntitled,
                    used: balance.emergencyUsed,
                    remaining: balance.emergencyRemaining,
                };
            default:
                return null;
        }
    };

    const selectedBalance = formData.leaveType && formData.leaveType !== 'OTHER'
        ? getBalance(formData.leaveType as LeaveType)
        : null;

    // Calculate leave duration
    const calculateDuration = () => {
        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
            return days;
        }
        return null;
    };

    const duration = calculateDuration();

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 transition-all duration-300 z-40 ${
                    isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
                onClick={onClose}
            />

            {/* Sliding Panel - FROM RIGHT */}
            <div
                className={`fixed top-0 right-0 h-full w-full md:w-1/2 lg:w-2/5 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Header - Fixed at top */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-5 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Request Leave</h2>
                            <p className="text-sm text-gray-500 mt-1">Fill in the details below</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Form Content - Scrollable area */}
                <div className="overflow-y-auto h-[calc(100%-80px)]">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Leave Type Section */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                Leave Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.leaveType}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        leaveType: e.target.value as LeaveType,
                                    })
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            >
                                <option value="">Select leave type</option>
                                <option value={LeaveType.ANNUAL}>🏖️ Annual Leave</option>
                                <option value={LeaveType.SICK}>🤒 Sick Leave</option>
                                <option value={LeaveType.EMERGENCY}>🚨 Emergency Leave</option>
                                <option value={LeaveType.COMPASSIONATE}>💝 Compassionate Leave</option>
                                <option value={LeaveType.MATERNITY_PATERNITY}>👶 Maternity / Paternity</option>
                                <option value={LeaveType.OFF_DAY}>🎯 Off Day</option>
                                <option value={LeaveType.OTHER}>📝 Other</option>
                            </select>
                            {errors.leaveType && (
                                <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                                    <AlertCircle size={14} /> {errors.leaveType}
                                </p>
                            )}
                        </div>

                        {/* Other Leave Type Input */}
                        {formData.leaveType === 'OTHER' && (
                            <div className="animate-slideDown">
                                <input
                                    value={formData.otherLeaveType}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            otherLeaveType: e.target.value,
                                        })
                                    }
                                    placeholder="Please specify leave type"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                                {errors.otherLeaveType && (
                                    <p className="text-red-500 text-sm mt-1">{errors.otherLeaveType}</p>
                                )}
                            </div>
                        )}

                        {/* Balance Display */}
                        {selectedBalance && formData.leaveType !== 'OFF_DAY' && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200 animate-fadeIn">
                                <div className="flex items-center gap-2 text-blue-700 mb-3">
                                    <Info size={18} />
                                    <span className="font-semibold">Leave Balance Overview</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-600 mb-1">Entitled</p>
                                        <p className="text-2xl font-bold text-blue-600">{selectedBalance.entitled}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-600 mb-1">Used</p>
                                        <p className="text-2xl font-bold text-orange-600">{selectedBalance.used}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-600 mb-1">Remaining</p>
                                        <p className="text-2xl font-bold text-green-600">{selectedBalance.remaining}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Date Selection */}
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-gray-700">
                                Leave Period <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) =>
                                            setFormData({ ...formData, startDate: e.target.value })
                                        }
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) =>
                                            setFormData({ ...formData, endDate: e.target.value })
                                        }
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                            {errors.startDate && (
                                <p className="text-red-500 text-sm">{errors.startDate}</p>
                            )}
                            {errors.endDate && (
                                <p className="text-red-500 text-sm">{errors.endDate}</p>
                            )}

                            {/* Duration Display */}
                            {duration && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                                    <Clock size={14} />
                                    <span>Duration: <strong>{duration}</strong> {duration === 1 ? 'day' : 'days'}</span>
                                </div>
                            )}
                        </div>

                        {/* Reason */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                Reason <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.reason}
                                onChange={(e) =>
                                    setFormData({ ...formData, reason: e.target.value })
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                                placeholder="Please provide a reason for your leave request..."
                                rows={4}
                            />
                            {errors.reason && (
                                <p className="text-red-500 text-sm">{errors.reason}</p>
                            )}
                        </div>

                        {/* Submit Error */}
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg">
                                {errors.submit}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 pb-8">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Submitting...
                                    </span>
                                ) : (
                                    'Submit Request'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default LeaveRequestModal;