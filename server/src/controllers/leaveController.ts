import { PrismaClient, Prisma, LeaveStatus, LeaveType, UserRole as PrismaUserRole } from "@prisma/client";
import { Request, Response } from "express";
import {LeavePolicyEngine} from "../leave/policy-engine/LeavePolicyEngine";

const prisma = new PrismaClient();

interface AuthUser {
    id: string;
    role: string;
}

const normalizeRole = (role: string): PrismaUserRole => {
    const normalized = role.toUpperCase() as PrismaUserRole;
    if (!["ADMIN", "ACCOUNTS", "STAFF"].includes(normalized)) {
        throw new Error(`Invalid role: ${role}`);
    }
    return normalized;
};

const createAuditLog = async (
    action: string,
    entityId: string,
    role: PrismaUserRole,
    cognitoId: string,
    extraMeta: Record<string, any> = {}
) => {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                entity: "LeaveRequest",
                entityId,
                [role === "ADMIN" ? "actorAdminCognitoId" : role === "ACCOUNTS" ? "actorAccountsCognitoId" : "actorStaffCognitoId"]: cognitoId,
                meta: {
                    role,
                    cognitoId,
                    ...extraMeta,
                },
            },
        });
    } catch (err) {
        console.warn("Failed to create audit log:", err);
    }
};

export const createLeaveRequest = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {
        const user = req.user as any;
        const role = normalizeRole(user.role);

        const {
            leaveType,
            otherLeaveType,
            startDate,
            endDate,
            reason,
        } = req.body;

        if (!startDate || !endDate || !leaveType) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            res.status(400).json({
                message: "Start date cannot be after end date",
            });
            return;
        }

        const year = new Date().getFullYear();

        const policy = await prisma.leavePolicy.findUnique({
            where: {
                year_role: {
                    year,
                    role,
                },
            },
        });

        if (!policy) {
            res.status(404).json({
                message: "Leave policy not found for user role",
            });
            return;
        }

        const leaveBalance = await prisma.leaveBalance.findUnique({
            where: {
                cognitoId_year: {
                    cognitoId: user.id,
                    year,
                },
            },
        });

        if (!leaveBalance) {
            res.status(404).json({
                message: "Leave balance not found",
            });
            return;
        }

        // 3. Get existing requests (for overlap checks inside engine)
        const existingRequests = await prisma.leaveRequest.findMany({
            where: {
                requesterCognitoId: user.id,
                status: {
                    not: "REJECTED",
                },
            },
        });

        const engine = new LeavePolicyEngine(
            prisma.leavePolicy,
            prisma.leavePolicyRule,
            prisma.leaveBalance,
            prisma.leaveLedger
        );

        const decision = await engine.evaluate({
            userId: user.id,
            role,
            leaveType,
            startDate: start,
            endDate: end,
            reason,
            serviceYears: user.serviceYears ?? 0,
        });

        // 5. Reject early if not allowed
        if (!decision.allowed) {
            res.status(400).json({
                message: decision.reason || "Leave request not allowed",
                decision,
            });
            return;
        }

        // 6. Create leave request (clean, no logic)
        const leaveRequest = await prisma.leaveRequest.create({
            data: {
                requesterCognitoId: user.id,
                requesterRole: role,

                leaveType,
                otherLeaveType:
                    leaveType === "OTHER"
                        ? otherLeaveType
                        : null,

                startDate: start,
                endDate: end,

                daysRequested: decision.chargeableDays,
                totalWorkingDays: decision.chargeableDays,

                reason,

                status: "PENDING",

                leaveBalanceId: leaveBalance.id,
            },
        });

        // 7. Audit log (unchanged responsibility)
        await createAuditLog(
            "CREATE_LEAVE_REQUEST",
            leaveRequest.id.toString(),
            role,
            user.id,
            {
                leaveType,
                daysRequested: decision.chargeableDays,
            }
        );

        // 8. Response
        res.status(201).json({
            message: "Leave request created successfully",
            request: leaveRequest,
            decision,
        });

    } catch (error: any) {
        console.error("Create leave request error:", error);

        res.status(500).json({
            message: "Failed to create leave request",
            error: error.message,
        });
    }
};

export const getMyLeaveRequests = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {
        const user = req.user as any;
        const role = normalizeRole(user.role);

        const {
            status,
            leaveType,
            page = 1,
            limit = 20,
        } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        // 1. Build filter
        const where: any = {
            requesterCognitoId: user.id,
        };

        if (status) {
            where.status = status;
        }

        if (leaveType) {
            where.leaveType = leaveType;
        }

        // 2. Fetch requests + count
        const [requests, total] = await Promise.all([
            prisma.leaveRequest.findMany({
                where,

                include: {
                    leaveBalance: {
                        select: {
                            id: true,
                            annualRemaining: true,
                            sickRemaining: true,
                            compassionateRemaining: true,
                            emergencyRemaining: true,
                        },
                    },

                    approvals: {
                        orderBy: {
                            approvalLevel: "asc",
                        },
                    },

                    ledgerEntries: {
                        orderBy: {
                            createdAt: "desc",
                        },
                        take: 3,
                    },
                },

                orderBy: {
                    createdAt: "desc",
                },

                skip,
                take: Number(limit),
            }),

            prisma.leaveRequest.count({ where }),
        ]);

        // 3. Audit log (kept but lightweight)
        await createAuditLog(
            "READ_MY_LEAVE_REQUESTS",
            user.id,
            role,
            user.id,
            {
                count: requests.length,
                filters: {
                    status,
                    leaveType,
                },
            }
        );

        // 4. Response shaping (important upgrade)
        res.json({
            data: requests,

            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        });

    } catch (error: any) {
        console.error("Get my leave requests error:", error);

        res.status(500).json({
            message: "Failed to fetch your leave requests",
            error: error.message,
        });
    }
};

export const getLeaveRequests = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {
        const user = req.user as any;

        const role = normalizeRole(user.role);

        const {
            status,
            leaveType,
            page = 1,
            limit = 20,
            mineOnly,
        } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        // 1. Build dynamic filters (enterprise pattern)
        const where: any = {};

        // Role-based scoping
        if (mineOnly === "true") {
            where.requesterCognitoId = user.id;
        }

        if (status) {
            where.status = status;
        }

        if (leaveType) {
            where.leaveType = leaveType;
        }

        // 2. Fetch data
        const [requests, total] = await Promise.all([
            prisma.leaveRequest.findMany({
                where,

                include: {
                    leaveBalance: {
                        select: {
                            id: true,
                            annualRemaining: true,
                            sickRemaining: true,
                            compassionateRemaining: true,
                            emergencyRemaining: true,
                        },
                    },

                    approvals: {
                        orderBy: { approvalLevel: "asc" },
                    },

                    ledgerEntries: {
                        orderBy: { createdAt: "desc" },
                        take: 5,
                    },
                },

                orderBy: {
                    createdAt: "desc",
                },

                skip,
                take: Number(limit),
            }),

            prisma.leaveRequest.count({ where }),
        ]);

        // 3. Response shaping (clean API contract)
        res.json({
            data: requests,

            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        });

    } catch (error) {
        console.error("Get leave requests error:", error);

        res.status(500).json({
            message: "Failed to fetch leave requests",
        });
    }
};

export const getUserLeaveData = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { cognitoId } = req.params;

        const admin = req.user as AuthUser;

        if (admin.role !== "admin") {
            console.log("❌ Access denied for role:", admin.role);

            res.status(403).json({ message: "Access denied" });
            return;
        }

        const currentYear = new Date().getFullYear();

        const [adminUser, accountUser, staffUser] = await Promise.all([
            prisma.admin.findUnique({
                where: { cognitoId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    cognitoId: true,
                    profilePicture: true,
                }
            }).catch(() => null),

            prisma.accounts.findUnique({
                where: { cognitoId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    cognitoId: true,
                    profilePicture: true,
                }
            }).catch(() => null),

            prisma.staff.findUnique({
                where: { cognitoId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    cognitoId: true,
                    profilePicture: true,
                }
            }).catch(() => null),
        ]);

        const user = adminUser || accountUser || staffUser;

        const [
            leaveBalance,
            leaveRequests,
            leaveAccruals,
            ledgerEntries,
            policy,
        ] = await Promise.all([
            prisma.leaveBalance.findUnique({
                where: {
                    cognitoId_year: {
                        cognitoId,
                        year: currentYear,
                    },
                },
            }),

            prisma.leaveRequest.findMany({
                where: {
                    requesterCognitoId: cognitoId,
                },
                include: {
                    approvals: {
                        orderBy: { approvalLevel: "asc" },
                    },
                    ledgerEntries: {
                        orderBy: { createdAt: "desc" },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),

            prisma.leaveAccrual.findMany({
                where: {
                    cognitoId,
                    year: currentYear,
                },
                orderBy: { processedAt: "desc" },
            }),

            prisma.leaveLedger.findMany({
                where: {
                    cognitoId,
                    year: currentYear,
                },
                orderBy: { createdAt: "desc" },
                take: 100,
            }),

            prisma.leaveBalance.findUnique({
                where: {
                    cognitoId_year: {
                        cognitoId,
                        year: currentYear,
                    },
                },
                include: {
                    policy: true,
                },
            }),
        ]);

        const summary = {
            totalRequests: leaveRequests.length,
            pendingRequests: leaveRequests.filter(r => r.status === "PENDING").length,
            approvedRequests: leaveRequests.filter(r => r.status === "APPROVED").length,
            rejectedRequests: leaveRequests.filter(r => r.status === "REJECTED").length,
        };

        if (!user) {
            console.log("⚠️ User not found in any table for cognitoId:", cognitoId);
        }

        res.json({
            success: true,
            data: {
                user,
                year: currentYear,
                balance: leaveBalance,
                policy: policy?.policy ?? null,
                requests: leaveRequests,
                accruals: leaveAccruals,
                ledger: ledgerEntries,
                summary,
            },
        });
    } catch (error: any) {
        console.error("❌ Error fetching user leave data:", error);

        res.status(500).json({
            message: "Failed to fetch user leave data",
        });
    }
};

export const previewLeaveDecision = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const user = req.user as AuthUser;

        const {
            leaveType,
            startDate,
            endDate,
            reason,
        } = req.body;

        if (!leaveType || !startDate || !endDate) {
            res.status(400).json({
                message: "leaveType, startDate, and endDate are required",
            });
            return;
        }

        const role = normalizeRole(user.role);
        const year = new Date().getFullYear();

        const start = new Date(startDate);
        const end = new Date(endDate);

        // 1. Load policy
        const policy = await prisma.leavePolicy.findUnique({
            where: {
                year_role: { year, role },
            },
        });

        if (!policy) {
            res.status(404).json({ message: "Leave policy not found" });
            return;
        }

        // 2. Load balance
        const leaveBalance = await prisma.leaveBalance.findUnique({
            where: {
                cognitoId_year: {
                    cognitoId: user.id,
                    year,
                },
            },
        });

        if (!leaveBalance) {
            res.status(404).json({ message: "Leave balance not found" });
            return;
        }

        // 3. Load existing requests (for overlap detection)
        const existingRequests = await prisma.leaveRequest.findMany({
            where: {
                requesterCognitoId: user.id,
                status: {
                    not: "REJECTED",
                },
            },
        });

        // 4. Working days function
        const calculateWorkingDays = (start: Date, end: Date, policy: any) => {
            let count = 0;
            const current = new Date(start);

            while (current <= end) {
                const day = current.getDay();
                if (day !== 0 && day !== 6) count++;
                current.setDate(current.getDate() + 1);
            }

            return count;
        };

        const engine = new LeavePolicyEngine(
            prisma.leavePolicy,
            prisma.leavePolicyRule,
            prisma.leaveBalance,
            prisma.leaveLedger
        );

        const decision = await engine.evaluate({
            userId: user.id,
            role,
            leaveType,
            startDate: start,
            endDate: end,
            reason,
            serviceYears: 0,
        });

        res.json({
            success: true,
            decision,
        });

    } catch (error: any) {
        console.error("previewLeaveDecision error:", error);

        res.status(500).json({
            message: "Failed to preview leave decision",
            error: error.message,
        });
    }
};

export const getLeaveBalance = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const user = req.user as any;

        const userId = user.cognitoId || user.id || user.sub;

        if (!userId) {
            res.status(400).json({
                message: "Invalid user identity (no cognitoId/id/sub found)",
            });
            return;
        }

        const year = new Date().getFullYear();

        const balance = await prisma.leaveBalance.findUnique({
            where: {
                cognitoId_year: {
                    cognitoId: userId,
                    year,
                },
            },
        });

        if (!balance) {
            res.status(404).json({
                message: "Leave balance not found",
            });
            return;
        }

        res.json(balance);
    } catch (error: any) {
        console.error("Get leave balance error:", error);

        res.status(500).json({
            message: "Failed to fetch leave balance",
            error: error.message,
        });
    }
};

export const getUserLeaveBalance = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const admin = req.user as AuthUser;
        const { cognitoId } = req.params;

        if (!admin) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (admin.role !== "admin") {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        const currentYear = new Date().getFullYear();

        const balance = await prisma.leaveBalance.findUnique({
            where: {
                cognitoId_year: {
                    cognitoId,
                    year: currentYear,
                },
            },
            include: {
                policy: true,
                ledgerEntries: {
                    take: 10,
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!balance) {
            res.status(404).json({
                message: "Leave balance not found for user",
                data: null,
            });
            return;
        }

        res.json({
            success: true,
            data: {
                cognitoId,
                year: currentYear,

                annual: {
                    entitled: balance.annualEntitled,
                    used: balance.annualUsed,
                    remaining: balance.annualRemaining,
                },

                sick: {
                    entitled: balance.sickEntitled,
                    used: balance.sickUsed,
                    remaining: balance.sickRemaining,
                },

                compassionate: {
                    entitled: balance.compassionateEntitled,
                    used: balance.compassionateUsed,
                    remaining: balance.compassionateRemaining,
                },

                emergency: {
                    entitled: balance.emergencyEntitled,
                    used: balance.emergencyUsed,
                    remaining: balance.emergencyRemaining,
                },

                isLocked: balance.isLocked,
                lastUpdatedAt: balance.lastUpdatedAt,
            },
        });
    } catch (error: any) {
        console.error("Get user leave balance error:", error);

        res.status(500).json({
            message: "Failed to fetch user leave balance",
            error: error.message,
        });
    }
};

export const rejectLeave = async (req: Request, res: Response): Promise<void> => {
    try {
        const admin = req.user as AuthUser;
        const { leaveRequestId, approvalId, comments } = req.body;

        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id: leaveRequestId },
        });

        if (!leaveRequest) {
            res.status(404).json({ message: "Leave request not found" });
            return;
        }

        await prisma.leaveApproval.update({
            where: { id: approvalId },
            data: {
                status: "REJECTED",
                comments,
                actionedAt: new Date(),
            },
        });

        const updatedRequest = await prisma.leaveRequest.update({
            where: { id: leaveRequestId },
            data: {
                status: "REJECTED",
                approvedByAdminCognitoId: admin.id,
                approvedAt: new Date(),
            },
        });

        await prisma.leaveLedger.create({
            data: {
                cognitoId: leaveRequest.requesterCognitoId,
                role: leaveRequest.requesterRole,
                year: new Date().getFullYear(),
                leaveType: leaveRequest.leaveType,
                transactionType: "CANCELLATION",
                days: leaveRequest.daysRequested,
                balanceBefore: 0,
                balanceAfter: 0,
                leaveRequestId: leaveRequest.id,
                performedByCognitoId: admin.id,
                remarks: "Leave rejected",
            },
        });

        res.json({
            message: "Leave rejected successfully",
            data: updatedRequest,
        });

    } catch (error: any) {
        console.error("Reject leave error:", error);
        res.status(500).json({
            message: "Failed to reject leave",
            error: error.message,
        });
    }
};

export const approveLeave = async (req: Request, res: Response): Promise<void> => {
    try {
        const admin = req.user as AuthUser;
        const { leaveRequestId, approvalId, comments } = req.body;

        const currentYear = new Date().getFullYear();

        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id: leaveRequestId },
            include: {
                approvals: true,
            },
        });

        if (!leaveRequest) {
            res.status(404).json({ message: "Leave request not found" });
            return;
        }

        // 1. Update approval step
        await prisma.leaveApproval.update({
            where: { id: approvalId },
            data: {
                status: "APPROVED",
                comments,
                actionedAt: new Date(),
            },
        });

        // 2. Check if all approvals are completed
        const allApproved = leaveRequest.approvals.every(
            (a) => a.id === approvalId ? true : a.status === "APPROVED"
        );

        // 3. If not fully approved → stop here
        if (!allApproved) {
            const partialUpdate = await prisma.leaveRequest.update({
                where: { id: leaveRequestId },
                data: {
                    status: "PENDING",
                },
            });

            res.json({
                message: "Leave partially approved",
                data: partialUpdate,
            });
            return;
        }

        // 4. Get balance
        const balance = await prisma.leaveBalance.findUnique({
            where: {
                cognitoId_year: {
                    cognitoId: leaveRequest.requesterCognitoId,
                    year: currentYear,
                },
            },
        });

        if (!balance) {
            res.status(404).json({ message: "Leave balance not found" });
            return;
        }

        const days = Number(leaveRequest.daysRequested);

        // 5. Compute balance impact
        let balanceBefore = 0;
        let balanceAfter = 0;

        switch (leaveRequest.leaveType) {
            case "ANNUAL":
                balanceBefore = Number(balance.annualRemaining);
                break;

            case "SICK":
                balanceBefore = Number(balance.sickRemaining);
                break;

            case "COMPASSIONATE":
                balanceBefore = Number(balance.compassionateRemaining);
                break;

            case "EMERGENCY":
                balanceBefore = Number(balance.emergencyRemaining);
                break;

            default:
                balanceBefore = 0;
        }

        balanceAfter = balanceBefore - days;

        // 6. Prevent negative balance
        if (balanceAfter < 0) {
            res.status(400).json({
                message: "Insufficient leave balance at approval time",
            });
            return;
        }

        // 7. Prepare update data
        const updateData: any = {};

        switch (leaveRequest.leaveType) {
            case "ANNUAL":
                updateData.annualUsed = { increment: days };
                updateData.annualRemaining = { decrement: days };
                break;

            case "SICK":
                updateData.sickUsed = { increment: days };
                updateData.sickRemaining = { decrement: days };
                break;

            case "COMPASSIONATE":
                updateData.compassionateUsed = { increment: days };
                updateData.compassionateRemaining = { decrement: days };
                break;

            case "EMERGENCY":
                updateData.emergencyUsed = { increment: days };
                updateData.emergencyRemaining = { decrement: days };
                break;
        }

        // 8. Apply balance update
        await prisma.leaveBalance.update({
            where: { id: balance.id },
            data: updateData,
        });

        // 9. Ledger entry
        await prisma.leaveLedger.create({
            data: {
                cognitoId: leaveRequest.requesterCognitoId,
                role: leaveRequest.requesterRole,
                year: currentYear,
                leaveType: leaveRequest.leaveType,
                transactionType: "APPROVAL",
                days,
                balanceBefore,
                balanceAfter,
                leaveRequestId: leaveRequest.id,
                performedByCognitoId: admin.id,
                remarks: comments || "Leave approved",
            },
        });

        // 10. Final request update
        const updatedRequest = await prisma.leaveRequest.update({
            where: { id: leaveRequestId },
            data: {
                status: "APPROVED",
                approvedAt: new Date(),
                approvedByAdminCognitoId: admin.id,
            },
        });

        res.json({
            message: "Leave fully approved",
            data: updatedRequest,
        });

    } catch (error: any) {
        console.error("Approve leave error:", error);
        res.status(500).json({
            message: "Failed to approve leave",
            error: error.message,
        });
    }
};