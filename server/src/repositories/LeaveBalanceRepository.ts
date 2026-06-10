import { PrismaClient } from "@prisma/client";

export class LeaveBalanceRepository {
    constructor(private prisma: PrismaClient) {}

    async getBalance(cognitoId: string, year: number) {
        return this.prisma.leaveBalance.findUnique({
            where: { cognitoId_year: { cognitoId, year } },
        });
    }
}