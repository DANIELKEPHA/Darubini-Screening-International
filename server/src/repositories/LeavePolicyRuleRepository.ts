import { PrismaClient, LeaveType } from "@prisma/client";

export class LeavePolicyRuleRepository {
    constructor(private prisma: PrismaClient) {}

    async getRules(leaveType: LeaveType) {
        return this.prisma.leavePolicyRule.findMany({
            where: { leaveType },
        });
    }
}