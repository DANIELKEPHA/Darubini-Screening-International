import { LeaveType, UserRole } from "@prisma/client";
import { LeaveDecision, LeaveEvaluationInput } from "./leave.types";

// Rules
import { AnnualLeaveRule } from "./rules/AnnualLeaveRule";
import { SickLeaveRule } from "./rules/SickLeaveRule";
import { MaternityLeaveRule } from "./rules/MaternityRule";
import { PaternityLeaveRule } from "./rules/PaternityRule";
import { DiscretionaryLeaveRule } from "./rules/DiscretionaryLeaveRule";
import {EmergencyLeaveRule} from "./rules/EmergencyRule"
import {CompassionateLeaveRule} from "./rules/CompassionateRule";

export class LeavePolicyEngine {
    constructor(
        private policyRepo: any,
        private ruleRepo: any,
        private balanceRepo: any,
        private requestRepo: any
    ) {}

    private ruleRegistry = {
        [LeaveType.ANNUAL]: AnnualLeaveRule,
        [LeaveType.SICK]: SickLeaveRule,
        [LeaveType.MATERNITY]: MaternityLeaveRule,
        [LeaveType.PATERNITY]: PaternityLeaveRule,
        [LeaveType.COMPASSIONATE]: CompassionateLeaveRule,
        [LeaveType.EMERGENCY]: EmergencyLeaveRule,
        [LeaveType.STUDY]: DiscretionaryLeaveRule,
        [LeaveType.UNPAID]: DiscretionaryLeaveRule,
        [LeaveType.OFF_DAY]: DiscretionaryLeaveRule,
        [LeaveType.PUBLIC_HOLIDAY]: DiscretionaryLeaveRule,
        [LeaveType.JURY_DUTY]: DiscretionaryLeaveRule,
        [LeaveType.BEREAVEMENT]: DiscretionaryLeaveRule,
        [LeaveType.OTHER]: DiscretionaryLeaveRule,
    };

    async evaluate(input: LeaveEvaluationInput): Promise<LeaveDecision> {

        // 1. Load policy
        const policy = await this.policyRepo.getPolicy(
            input.role,
            new Date().getFullYear()
        );

        if (!policy) {
            throw new Error("No leave policy found for role/year");
        }

        // 2. Load rules (optional metadata rules)
        const rules = await this.ruleRepo.getRules(input.leaveType);

        // 3. Load balance
        const leaveBalance = await this.balanceRepo.getBalance(
            input.userId,
            new Date().getFullYear()
        );

        // 4. Load overlapping requests
        const existingRequests = await this.requestRepo.findUserRequests(
            input.userId,
            input.startDate,
            input.endDate
        );

        // 5. Resolve rule
        const Rule = this.ruleRegistry[input.leaveType];

        if (!Rule) {
            throw new Error(`No rule registered for leave type: ${input.leaveType}`);
        }

        // 6. Execute rule
        return Rule.evaluate({
            input,
            policy,
            rules,
            leaveBalance,
            existingRequests,
            calculateWorkingDays: this.calculateWorkingDays.bind(this),
        });
    }

    /**
     * CORE UTIL: working days calculator
     */
    private calculateWorkingDays(
        startDate: Date,
        endDate: Date,
        policy: any
    ): number {
        let count = 0;

        const current = new Date(startDate);

        while (current <= endDate) {

            const day = current.getDay(); // 0 = Sunday, 6 = Saturday

            const isWeekend = day === 0 || day === 6;

            if (policy.includeWeekends) {
                count++;
            } else if (!isWeekend) {
                count++;
            }

            current.setDate(current.getDate() + 1);
        }

        return count;
    }
}