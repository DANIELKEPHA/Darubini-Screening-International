import { LeaveType } from "@prisma/client";
import {
    LeaveDecision,
    LeaveEvaluationContext,
} from "../leave.types";

export class DiscretionaryLeaveRule {

    static evaluate(ctx: LeaveEvaluationContext): LeaveDecision {

        const {
            input,
            policy,
            existingRequests,
            calculateWorkingDays,
        } = ctx;

        const days = calculateWorkingDays(
            input.startDate,
            input.endDate,
            policy
        );

        if (days <= 0) {
            return this.fail(
                input.leaveType,
                "Invalid leave duration"
            );
        }

        // Prevent overlaps
        const hasOverlap = existingRequests.some(request =>
            request.status !== "REJECTED" &&
            input.startDate <= request.endDate &&
            input.endDate >= request.startDate
        );

        if (hasOverlap) {
            return this.fail(
                input.leaveType,
                "Leave request overlaps an existing leave request"
            );
        }

        let maxDays: number | undefined;
        let requiresMedical = false;

        switch (input.leaveType) {

            case LeaveType.COMPASSIONATE:
                maxDays = 14;
                break;

            case LeaveType.EMERGENCY:
                maxDays = 5;
                break;

            case LeaveType.STUDY:
                maxDays = policy.studyLeaveDays ?? undefined;
                break;

            case LeaveType.BEREAVEMENT:
                maxDays = 14;
                break;

            case LeaveType.OTHER:
                maxDays = undefined;
                break;

            default:
                maxDays = undefined;
        }

        const allowed =
            maxDays === undefined
                ? true
                : days <= maxDays;

        return {
            allowed,

            leaveCategory: "DISCRETIONARY",

            chargeableDays: days,

            payImpact: {
                // Final pay treatment determined during approval
                fullPayDays: days,
                halfPayDays: 0,
                unpaidDays: 0,
            },

            balanceImpact: {
                leaveType: input.leaveType,
                daysToDeduct: 0,
            },

            requiredApprovals: [
                "MANAGER",
                "HR",
            ],

            policyFlags: {
                requiresMedical,
                allowsHalfDay: true,
                isDiscretionary: true,
            },

            reason: allowed
                ? undefined
                : `Requested ${days} day(s), maximum allowed is ${maxDays}`,

            metadata: {
                leaveType: input.leaveType,
                maxAllowedDays: maxDays,
                requiresManagementReview: true,
                approvalRequired: true,
            },
        };
    }

    private static fail(
        leaveType: LeaveType,
        reason: string
    ): LeaveDecision {

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
                leaveType,
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
            },
        };
    }
}