import { LeaveType } from "@prisma/client";
import {
    LeaveDecision,
    LeaveEvaluationContext,
} from "../leave.types";

export class PaternityLeaveRule {

    static evaluate(ctx: LeaveEvaluationContext): LeaveDecision {

        const {
            input,
            existingRequests,
        } = ctx;

        // Paternity leave is measured in calendar days
        const days =
            Math.ceil(
                (
                    input.endDate.getTime() -
                    input.startDate.getTime()
                ) / (1000 * 60 * 60 * 24)
            ) + 1;

        if (days <= 0) {
            return this.fail("Invalid paternity leave period");
        }

        // Prevent overlapping leave requests
        const hasOverlap = existingRequests.some(request =>
            request.status !== "REJECTED" &&
            input.startDate <= request.endDate &&
            input.endDate >= request.startDate
        );

        if (hasOverlap) {
            return this.fail(
                "Paternity leave overlaps with an existing leave request"
            );
        }

        const MAX_PATERNITY_DAYS = 28;

        const allowed = days <= MAX_PATERNITY_DAYS;

        return {
            allowed,

            leaveCategory: "SPECIAL_RULE",

            chargeableDays: days,

            payImpact: {
                fullPayDays: Math.min(days, MAX_PATERNITY_DAYS),
                halfPayDays: 0,
                unpaidDays: Math.max(0, days - MAX_PATERNITY_DAYS),
            },

            balanceImpact: {
                leaveType: LeaveType.PATERNITY,
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
                : `Paternity leave cannot exceed ${MAX_PATERNITY_DAYS} calendar days`,

            metadata: {
                maxAllowedDays: MAX_PATERNITY_DAYS,

                supportingDocumentRequired: true,

                acceptedDocuments: [
                    "Birth Notification",
                    "Expected Delivery Medical Certificate",
                ],

                balanceBefore: 0,
                balanceAfter: 0,
                entitledDays: MAX_PATERNITY_DAYS,
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
                leaveType: LeaveType.PATERNITY,
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