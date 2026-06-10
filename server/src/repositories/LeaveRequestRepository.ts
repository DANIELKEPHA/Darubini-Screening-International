import { PrismaClient } from "@prisma/client";

export class LeaveRequestRepository {
    constructor(private prisma: PrismaClient) {}

    async findUserRequests(userId: string, startDate: Date, endDate: Date) {
        return this.prisma.leaveRequest.findMany({
            where: {
                requesterCognitoId: userId,
                status: { not: "REJECTED" },
                OR: [
                    { startDate: { lte: endDate }, endDate: { gte: startDate } },
                ],
            },
        });
    }
}