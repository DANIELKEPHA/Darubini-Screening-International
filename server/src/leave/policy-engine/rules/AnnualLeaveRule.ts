import {LeaveBalance, LeavePolicy, LeaveRequest, LeaveType} from "@prisma/client";
import {LeaveDecision, LeaveEvaluationInput} from "../leave.types";

export class AnnualLeaveRule {

    static evaluate(params: {
        input: LeaveEvaluationInput;
        policy: LeavePolicy;
        leaveBalance: LeaveBalance;
        existingRequests: LeaveRequest[];
        calculateWorkingDays: Function;
    }): LeaveDecision {

        const {
            input,
            policy,
            leaveBalance,
            existingRequests,
            calculateWorkingDays
        } = params;

        const days = calculateWorkingDays(
            input.startDate,
            input.endDate,
            policy
        );

        if (days <= 0) {
            return this.fail("Leave duration must be greater than zero", days);
        }

        const hasOverlap = existingRequests.some(r =>
            r.status !== "REJECTED" &&
            input.startDate <= r.endDate &&
            input.endDate >= r.startDate
        );

        if (hasOverlap) {
            return this.fail("Leave overlaps existing request", days);
        }

        if (leaveBalance.isLocked) {
            return this.fail("Leave balance is locked", days);
        }

        const remaining = leaveBalance.annualRemaining.toNumber();

        const allowed = remaining >= days;

        return {
            allowed,

            leaveCategory: "ENTITLED",

            chargeableDays: days,

            payImpact: {
                fullPayDays: days,
                halfPayDays: 0,
                unpaidDays: 0
            },

            balanceImpact: {
                leaveType: LeaveType.ANNUAL,
                daysToDeduct: days
            },

            requiredApprovals: [
                "MANAGER",
                "HR"
            ],

            policyFlags: {
                requiresMedical: false,
                allowsHalfDay: true,
                isDiscretionary: false
            },

            reason: allowed
                ? undefined
                : `Insufficient balance. Available: ${remaining}, Requested: ${days}`
        };
    }

    private static fail(reason: string, days: number): LeaveDecision {
        return {
            allowed: false,
            leaveCategory: "ENTITLED",
            chargeableDays: days,
            payImpact: {
                fullPayDays: 0,
                halfPayDays: 0,
                unpaidDays: 0
            },
            balanceImpact: {
                leaveType: LeaveType.ANNUAL,
                daysToDeduct: 0
            },
            requiredApprovals: [],
            policyFlags: {
                requiresMedical: false,
                allowsHalfDay: true,
                isDiscretionary: false
            },
            reason
        };
    }
}