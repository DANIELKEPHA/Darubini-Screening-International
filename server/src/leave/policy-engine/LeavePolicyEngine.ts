import { LeaveDecision, LeaveEvaluationInput } from "./leave.types";

// Rules
import { AnnualLeaveRule } from "./rules/AnnualLeaveRule";
import { SickLeaveRule } from "./rules/SickLeaveRule";
import { MaternityLeaveRule } from "./rules/MaternityRule";
import { PaternityLeaveRule } from "./rules/PaternityRule";
import { DiscretionaryLeaveRule } from "./rules/DiscretionaryLeaveRule";
import { EmergencyLeaveRule } from "./rules/EmergencyRule";
import { CompassionateLeaveRule } from "./rules/CompassionateRule";

export class LeavePolicyEngine {
    constructor(
        private policyRepo: any,
        private ruleRepo: any,
        private balanceRepo: any,
        private requestRepo: any
    ) {}

    private ruleRegistry = {
        ANNUAL: AnnualLeaveRule,
        SICK: SickLeaveRule,
        MATERNITY: MaternityLeaveRule,
        PATERNITY: PaternityLeaveRule,
        COMPASSIONATE: CompassionateLeaveRule,
        EMERGENCY: EmergencyLeaveRule,
        STUDY: DiscretionaryLeaveRule,
        UNPAID: DiscretionaryLeaveRule,
        OFF_DAY: DiscretionaryLeaveRule,
        PUBLIC_HOLIDAY: DiscretionaryLeaveRule,
        JURY_DUTY: DiscretionaryLeaveRule,
        BEREAVEMENT: DiscretionaryLeaveRule,
        OTHER: DiscretionaryLeaveRule,
    };

    async evaluate(input: LeaveEvaluationInput): Promise<LeaveDecision> {
        const year = new Date().getFullYear();

        // 1. Load Policy
        const policy = await this.policyRepo.getPolicy(input.role, year);
        if (!policy) {
            throw new Error(`No leave policy found for role ${input.role} in year ${year}`);
        }

        // 2. Load Rules
        const rules = await this.ruleRepo.getRules(input.leaveType);

        // 3. Load Balance
        const leaveBalance = await this.balanceRepo.getBalance(input.userId, year);
        if (!leaveBalance) {
            throw new Error("Leave balance not found for this user and year");
        }

        // 4. Load Overlapping Requests
        const existingRequests = await this.requestRepo.findUserRequests(
            input.userId,
            input.startDate,
            input.endDate
        );

        // 5. Execute Rule
        const RuleClass = this.ruleRegistry[input.leaveType];
        if (!RuleClass) {
            throw new Error(`No rule registered for leave type: ${input.leaveType}`);
        }

        return RuleClass.evaluate({
            input,
            policy,
            rules,
            leaveBalance,
            existingRequests,
            calculateWorkingDays: this.calculateWorkingDays.bind(this),
        });
    }

    private calculateWorkingDays(startDate: Date, endDate: Date, policy: any): number {
        let count = 0;
        const current = new Date(startDate);

        while (current <= endDate) {
            const day = current.getDay();
            const isWeekend = day === 0 || day === 6;

            if (policy.includeWeekends || !isWeekend) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        return count;
    }
}