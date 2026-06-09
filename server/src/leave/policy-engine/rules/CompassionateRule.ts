import { LeaveType } from "@prisma/client";
import {
    LeaveDecision,
    LeaveEvaluationContext,
} from "../leave.types";

import { DiscretionaryLeaveRule } from "./DiscretionaryLeaveRule";

export class CompassionateLeaveRule {

    static evaluate(ctx: LeaveEvaluationContext): LeaveDecision {

        const {
            input,
            existingRequests,
            calculateWorkingDays,
        } = ctx;

        // 1. Compute working days
        const days = calculateWorkingDays(
            input.startDate,
            input.endDate,
            ctx.policy
        );

        if (days <= 0) {
            return this.fail("Invalid compassionate leave duration");
        }

        // 2. Overlap check
        const hasOverlap = existingRequests.some(req =>
            req.status !== "REJECTED" &&
            input.startDate <= req.endDate &&
            input.endDate >= req.startDate
        );

        if (hasOverlap) {
            return this.fail("Compassionate leave overlaps existing leave request");
        }

        // 3. Compassionate-specific rules
        const MAX_DAYS = 14;

        const allowed = days <= MAX_DAYS;

        // 4. Required approval logic (stricter than general discretionary)
        const requiredApprovals =
            days <= 3
                ? ["MANAGER"]
                : ["MANAGER", "HR"];

        // 5. Call shared discretionary engine for structure consistency
        const baseDecision = DiscretionaryLeaveRule.evaluate(ctx);

        return {
            ...baseDecision,

            allowed,

            leaveCategory: "DISCRETIONARY",

            chargeableDays: days,

            balanceImpact: {
                leaveType: LeaveType.COMPASSIONATE,
                daysToDeduct: 0, // discretionary leave often not auto-deducted until approval
            },

            requiredApprovals,

            policyFlags: {
                requiresMedical: true,
                allowsHalfDay: false,
                isDiscretionary: true,
            },

            reason: allowed
                ? undefined
                : `Compassionate leave cannot exceed ${MAX_DAYS} days`,

            metadata: {
                maxAllowedDays: MAX_DAYS,
                requiresProof: true,
                acceptedProof: [
                    "Death Certificate",
                    "Medical Report (Serious Illness)",
                ],
                relationshipRequired: [
                    "Spouse",
                    "Child",
                    "Parent",
                    "Sibling",
                ],
                approvalTier: days <= 3 ? "MANAGER_ONLY" : "HR_REQUIRED",
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
                leaveType: LeaveType.COMPASSIONATE,
                daysToDeduct: 0,
            },

            requiredApprovals: [],

            policyFlags: {
                requiresMedical: true,
                allowsHalfDay: false,
                isDiscretionary: true,
            },

            reason,

            metadata: {
                validationFailed: true,
                leaveType: LeaveType.COMPASSIONATE,
            },
        };
    }
}