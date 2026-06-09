import { LeaveType } from "@prisma/client";
import {LeaveDecision, LeaveEvaluationContext} from "../leave.types";

export class SickLeaveRule {

    static evaluate(ctx: LeaveEvaluationContext): LeaveDecision {

        const {
            input,
            policy,
            leaveBalance,
            existingRequests,
            calculateWorkingDays
        } = ctx;

        // 1. Calculate working days
        const days = calculateWorkingDays(
            input.startDate,
            input.endDate,
            policy
        );

        if (days <= 0) {
            return this.fail("Invalid leave duration", days);
        }

        // 2. Overlap check
        const hasOverlap = existingRequests.some(req =>
            req.status !== "REJECTED" &&
            input.startDate <= req.endDate &&
            input.endDate >= req.startDate
        );

        if (hasOverlap) {
            return this.fail("Sick leave overlaps existing request", days);
        }

        if (leaveBalance.isLocked) {
            return this.fail("Leave balance is locked", days);
        }

        const isNewEmployee = input.serviceYears < 1;

        const fullPayLimit = isNewEmployee ? 7 : 30;
        const halfPayLimit = isNewEmployee ? 7 : 15;

        let fullPayDays = 0;
        let halfPayDays = 0;
        let unpaidDays = 0;

        if (days <= fullPayLimit) {
            fullPayDays = days;
        } else if (days <= fullPayLimit + halfPayLimit) {
            fullPayDays = fullPayLimit;
            halfPayDays = days - fullPayLimit;
        } else {
            fullPayDays = fullPayLimit;
            halfPayDays = halfPayLimit;
            unpaidDays = days - (fullPayLimit + halfPayLimit);
        }

        const remaining = leaveBalance.sickRemaining.toNumber();

        const allowed = remaining >= days;

        const balanceAfter = remaining - days;

        return {
            allowed,

            leaveCategory: "ENTITLED",

            chargeableDays: days,

            payImpact: {
                fullPayDays,
                halfPayDays,
                unpaidDays
            },

            balanceImpact: {
                leaveType: LeaveType.SICK,
                daysToDeduct: days
            },

            requiredApprovals: [
                "MANAGER",
                "HR"
            ],

            policyFlags: {
                requiresMedical: true,
                allowsHalfDay: true,
                isDiscretionary: false
            },

            reason: allowed
                ? undefined
                : `Insufficient sick leave balance. Available: ${remaining}, Requested: ${days}`,

            metadata: {
                balanceBefore: remaining,
                balanceAfter,
                entitledDays: leaveBalance.annualEntitled.toNumber(),
                usedDays: leaveBalance.annualUsed.toNumber()
            }
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
                leaveType: LeaveType.SICK,
                daysToDeduct: 0
            },

            requiredApprovals: [],

            policyFlags: {
                requiresMedical: true,
                allowsHalfDay: true,
                isDiscretionary: false
            },

            reason
        };
    }
}