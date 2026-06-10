import { PrismaClient, UserRole } from "@prisma/client";

export class LeavePolicyRepository {
    constructor(private prisma: PrismaClient) {}

    async getPolicy(role: UserRole, year: number) {
        return this.prisma.leavePolicy.findUnique({
            where: { year_role: { year, role } },
        });
    }
}
