import { LeaveType } from "@prisma/client";
import {
    LeaveDecision,
    LeaveEvaluationContext,
} from "../leave.types";

import { DiscretionaryLeaveRule } from "./DiscretionaryLeaveRule";

export class EmergencyLeaveRule {

    static evaluate(ctx: LeaveEvaluationContext): LeaveDecision {

        const {
            input,
            existingRequests,
            calculateWorkingDays,
        } = ctx;

        // 1. Calculate working days
        const days = calculateWorkingDays(
            input.startDate,
            input.endDate,
            ctx.policy
        );

        if (days <= 0) {
            return this.fail("Invalid emergency leave duration");
        }

        // 2. Overlap check (critical for emergency leave)
        const hasOverlap = existingRequests.some(req =>
            req.status !== "REJECTED" &&
            input.startDate <= req.endDate &&
            input.endDate >= req.startDate
        );

        if (hasOverlap) {
            return this.fail("Emergency leave overlaps with existing leave request");
        }

        // 3. Emergency leave rules (policy-driven but capped)
        const MAX_DAYS = 5;

        const allowed = days <= MAX_DAYS;

        // 4. Approval is always required
        const requiredApprovals =
            days <= 2
                ? ["MANAGER"]
                : ["MANAGER", "HR"];

        // 5. Base discretionary structure (reuse engine consistency)
        const baseDecision = DiscretionaryLeaveRule.evaluate(ctx);

        return {
            ...baseDecision,

            allowed,

            leaveCategory: "DISCRETIONARY",

            chargeableDays: days,

            balanceImpact: {
                leaveType: LeaveType.EMERGENCY,
                daysToDeduct: 0, // typically not auto-deducted until approved
            },

            requiredApprovals,

            policyFlags: {
                requiresMedical: false,
                allowsHalfDay: true,
                isDiscretionary: true,
            },

            reason: allowed
                ? undefined
                : `Emergency leave cannot exceed ${MAX_DAYS} days`,

            metadata: {
                maxAllowedDays: MAX_DAYS,
                urgencyLevel: "HIGH",

                approvalTier:
                    days <= 2
                        ? "MANAGER_ONLY"
                        : "HR_REQUIRED",

                requiresJustification: true,

                acceptableReasons: [
                    "Family emergency",
                    "Accident",
                    "Urgent personal/legal matter",
                    "Hospital admission",
                ],
            },
        };
    }

    private static fail(reason: string): LeaveDecision {
        return {
            allowed: false,

            leaveCategory: "DISCRETIONARY",

            chargeableDays: 0,

            payImpact: {
                fullPayDays: 0,
                halfPayDays: 0,
                unpaidDays: 0,
            },

            balanceImpact: {
                leaveType: LeaveType.EMERGENCY,
                daysToDeduct: 0,
            },

            requiredApprovals: [],

            policyFlags: {
                requiresMedical: false,
                allowsHalfDay: true,
                isDiscretionary: true,
            },

            reason,

            metadata: {
                validationFailed: true,
                leaveType: LeaveType.EMERGENCY,
            },
        };
    }
}