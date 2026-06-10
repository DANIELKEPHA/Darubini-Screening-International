import {LeaveBalance, LeavePolicy, LeaveRequest, LeaveType, UserRole} from "@prisma/client";

export interface LeaveDecision {
    allowed: boolean;

    reason?: string;

    leaveCategory:
        | "ENTITLED"
        | "DISCRETIONARY"
        | "SPECIAL_RULE";

    chargeableDays: number;

    payImpact: {
        fullPayDays: number;
        halfPayDays: number;
        unpaidDays: number;
    };

    balanceImpact: {
        leaveType: LeaveType;
        daysToDeduct: number;
    };

    requiredApprovals: string[];

    policyFlags: {
        requiresMedical: boolean;
        allowsHalfDay: boolean;
        isDiscretionary: boolean;
    };

    metadata?: {
        balanceBefore?: number;
        balanceAfter?: number;
        entitledDays?: number;
        usedDays?: number;

        [key: string]: unknown;
    };
}

export interface LeaveEvaluationInput {
    userId: string;
    role: UserRole;
    leaveType: LeaveType;
    otherLeaveType?: string;
    startDate: Date;
    endDate: Date;

    reason?: string;

    serviceYears: number;
}

export interface LeaveEvaluationContext {
    input: LeaveEvaluationInput;

    policy: LeavePolicy;

    leaveBalance: LeaveBalance;

    existingRequests: LeaveRequest[];

    rules?: any;

    calculateWorkingDays: (
        startDate: Date,
        endDate: Date,
        policy: LeavePolicy
    ) => number;
}