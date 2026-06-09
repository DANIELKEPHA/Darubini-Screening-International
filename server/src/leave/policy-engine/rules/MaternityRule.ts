import { LeaveType } from "@prisma/client";
import {
    LeaveDecision,
    LeaveEvaluationContext,
} from "../leave.types";

export class MaternityLeaveRule {

    static evaluate(ctx: LeaveEvaluationContext): LeaveDecision {

        const {
            input,
            existingRequests,
        } = ctx;

        // Maternity leave is based on calendar days,
        // not working days.

        const days =
            Math.ceil(
                (
                    input.endDate.getTime() -
                    input.startDate.getTime()
                ) / (1000 * 60 * 60 * 24)
            ) + 1;

        if (days <= 0) {
            return this.fail("Invalid maternity leave period");
        }

        // Prevent overlaps
        const hasOverlap = existingRequests.some(request =>
            request.status !== "REJECTED" &&
            input.startDate <= request.endDate &&
            input.endDate >= request.startDate
        );

        if (hasOverlap) {
            return this.fail(
                "Maternity leave overlaps with an existing leave request"
            );
        }

        const MAX_MATERNITY_DAYS = 90;

        const allowed = days <= MAX_MATERNITY_DAYS;

        return {
            allowed,

            leaveCategory: "SPECIAL_RULE",

            chargeableDays: days,

            payImpact: {
                fullPayDays: Math.min(days, 90),
                halfPayDays: 0,
                unpaidDays: Math.max(0, days - 90),
            },

            balanceImpact: {
                leaveType: LeaveType.MATERNITY,
                daysToDeduct: 0,
            },

            requiredApprovals: [
                "MANAGER",
                "HR",
            ],

            policyFlags: {
                requiresMedical: true,
                allowsHalfDay: false,
                isDiscretionary: false,
            },

            reason: allowed
                ? undefined
                : `Maternity leave cannot exceed ${MAX_MATERNITY_DAYS} calendar days`,

            metadata: {
                maxAllowedDays: MAX_MATERNITY_DAYS,

                fourthMonthHalfDayRequired: true,

                medicalDocumentationRequired: true,

                balanceBefore: 0,
                balanceAfter: 0,
                entitledDays: MAX_MATERNITY_DAYS,
                usedDays: 0,
            },
        };
    }

    private static fail(reason: string): LeaveDecision {

        return {
            allowed: false,

            leaveCategory: "SPECIAL_RULE",

            chargeableDays: 0,

            payImpact: {
                fullPayDays: 0,
                halfPayDays: 0,
                unpaidDays: 0,
            },

            balanceImpact: {
                leaveType: LeaveType.MATERNITY,
                daysToDeduct: 0,
            },

            requiredApprovals: [],

            policyFlags: {
                requiresMedical: true,
                allowsHalfDay: false,
                isDiscretionary: false,
            },

            reason,
        };
    }
}