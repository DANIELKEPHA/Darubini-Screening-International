import { PrismaClient, Prisma, LeaveStatus, LeaveType, UserRole as PrismaUserRole } from "@prisma/client";
import { Request, Response } from "express";
import {LeavePolicyEngine} from "../leave/policy-engine/LeavePolicyEngine";
import {LeavePolicyRepository} from "../repositories/LeavePolicyRepository";
import {LeaveBalanceRepository} from "../repositories/LeaveBalanceRepository";
import {LeavePolicyRuleRepository} from "../repositories/LeavePolicyRuleRepository";
import {LeaveRequestRepository} from "../repositories/LeaveRequestRepository";
import PDFDocument from "pdfkit";
import {PassThrough} from "node:stream";

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
        if (!user?.id) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const role = normalizeRole(user.role);

        const { leaveType, otherLeaveType, startDate, endDate, reason } = req.body;

        if (!leaveType || !startDate || !endDate) {
            res.status(400).json({
                message: "Missing required fields: leaveType, startDate, endDate"
            });
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const year = new Date().getFullYear();

        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
            res.status(400).json({ message: "Invalid date range" });
            return;
        }

        const policyRepo = new LeavePolicyRepository(prisma);
        const ruleRepo = new LeavePolicyRuleRepository(prisma);
        const balanceRepo = new LeaveBalanceRepository(prisma);
        const requestRepo = new LeaveRequestRepository(prisma);

        const engine = new LeavePolicyEngine(policyRepo, ruleRepo, balanceRepo, requestRepo);

        const decision = await engine.evaluate({
            userId: user.id,
            role,
            leaveType,
            otherLeaveType: leaveType === "OTHER" ? otherLeaveType : undefined,
            startDate: start,
            endDate: end,
            reason,
            serviceYears: user.serviceYears ?? 0,
        });

        if (!decision.allowed) {
            res.status(400).json({
                message: decision.reason || "Leave request not allowed by policy",
                decision,
            });
            return;
        }

        const leaveBalance = await balanceRepo.getBalance(user.id, year);

        if (!leaveBalance) {
            res.status(404).json({
                message: "Leave balance not found for this year. Please contact admin to initialize balances."
            });
            return;
        }

        const leaveRequest = await prisma.$transaction(async (tx) => {
            const createdRequest = await tx.leaveRequest.create({
                data: {
                    requesterCognitoId: user.id,
                    requesterRole: role,
                    leaveType,
                    otherLeaveType: leaveType === "OTHER" ? otherLeaveType : null,
                    startDate: start,
                    endDate: end,
                    daysRequested: decision.chargeableDays,
                    totalWorkingDays: decision.chargeableDays,
                    reason: reason || null,
                    status: "PENDING",
                    leaveBalanceId: leaveBalance.id,
                },
            });

            await createAuditLog(
                "CREATE_LEAVE_REQUEST",
                createdRequest.id.toString(),
                role,
                user.id,
                {
                    leaveType,
                    daysRequested: decision.chargeableDays,
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                },
            );

            return createdRequest;
        });

        res.status(201).json({
            message: "Leave request created successfully and pending approval",
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
                    remaining:
                        Number(balance.annualEntitled) -
                        Number(balance.annualUsed),
                },

                sick: {
                    entitled: balance.sickEntitled,
                    used: balance.sickUsed,
                    remaining:
                        Number(balance.sickEntitled) -
                        Number(balance.sickUsed),
                },

                compassionate: {
                    entitled: balance.compassionateEntitled,
                    used: balance.compassionateUsed,
                    remaining:
                        Number(balance.compassionateEntitled) -
                        Number(balance.compassionateUsed),
                },

                emergency: {
                    entitled: balance.emergencyEntitled,
                    used: balance.emergencyUsed,
                    remaining:
                        Number(balance.emergencyEntitled) -
                        Number(balance.emergencyUsed),
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
        const { leaveRequestId, comments } = req.body;

        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id: leaveRequestId },
        });

        if (!leaveRequest) {
            return void res.status(404).json({ message: "Leave not found" });
        }

        await prisma.leaveRequest.update({
            where: { id: leaveRequestId },
            data: {
                status: "REJECTED",
                approvedAt: new Date(),
                approvedByAdminCognitoId: admin.id,
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
                remarks: comments || "Rejected",
            },
        });

        res.json({
            message: "Leave rejected successfully",
        });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Failed to reject leave" });
    }
};

export const approveLeave = async (req: Request, res: Response): Promise<void> => {
    try {
        const admin = req.user as AuthUser;
        const { leaveRequestId, comments } = req.body;

        const currentYear = new Date().getFullYear();

        console.log("🚀 Approve triggered:", { leaveRequestId, admin: admin.id });

        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id: leaveRequestId },
            include: { approvals: true },
        });

        if (!leaveRequest) {
            return void res.status(404).json({ message: "Leave request not found" });
        }

        // 🔥 FIND NEXT PENDING APPROVAL (NO approvalId EVER)
        const nextApproval = leaveRequest.approvals.find(
            a => a.status === "PENDING"
        );

        console.log("🧭 Next approval step:", nextApproval);

        // If approvals exist, update next step
        if (nextApproval) {
            await prisma.leaveApproval.update({
                where: { id: nextApproval.id },
                data: {
                    status: "APPROVED",
                    comments,
                    actionedAt: new Date(),
                },
            });
        }

        // Check remaining pending approvals
        const remainingPending = leaveRequest.approvals.some(
            a => a.status === "PENDING" && a.id !== nextApproval?.id
        );

        if (remainingPending) {
            const updated = await prisma.leaveRequest.update({
                where: { id: leaveRequestId },
                data: {
                    status: "PENDING",
                },
            });

            return void res.json({
                message: "Leave partially approved",
                data: updated,
            });
        }

        // ✅ FINAL APPROVAL → APPLY BALANCE LOGIC
        const balance = await prisma.leaveBalance.findUnique({
            where: {
                cognitoId_year: {
                    cognitoId: leaveRequest.requesterCognitoId,
                    year: currentYear,
                },
            },
        });

        if (!balance) {
            return void res.status(404).json({ message: "Leave balance not found" });
        }

        const days = Number(leaveRequest.daysRequested);

        let balanceBefore = 0;

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
        }

        const balanceAfter = balanceBefore - days;

        if (balanceAfter < 0) {
            return void res.status(400).json({
                message: "Insufficient leave balance",
            });
        }

        await prisma.leaveBalance.update({
            where: { id: balance.id },
            data: {
                annualUsed: leaveRequest.leaveType === "ANNUAL" ? { increment: days } : undefined,
                annualRemaining: leaveRequest.leaveType === "ANNUAL" ? { decrement: days } : undefined,
                sickUsed: leaveRequest.leaveType === "SICK" ? { increment: days } : undefined,
                sickRemaining: leaveRequest.leaveType === "SICK" ? { decrement: days } : undefined,
                compassionateUsed: leaveRequest.leaveType === "COMPASSIONATE" ? { increment: days } : undefined,
                compassionateRemaining: leaveRequest.leaveType === "COMPASSIONATE" ? { decrement: days } : undefined,
                emergencyUsed: leaveRequest.leaveType === "EMERGENCY" ? { increment: days } : undefined,
                emergencyRemaining: leaveRequest.leaveType === "EMERGENCY" ? { decrement: days } : undefined,
            },
        });

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
                remarks: comments || "Approved",
            },
        });

        const final = await prisma.leaveRequest.update({
            where: { id: leaveRequestId },
            data: {
                status: "APPROVED",
                approvedAt: new Date(),
                approvedByAdminCognitoId: admin.id,
            },
        });

        return void res.json({
            message: "Leave fully approved",
            data: final,
        });

    } catch (error: any) {
        console.error("Approve error:", error);
        res.status(500).json({
            message: "Failed to approve leave",
            error: error.message,
        });
    }
};

export const downloadLeaveApprovalPdf = async (req: Request, res: Response): Promise<void> => {
    try {
        const { leaveRequestId } = req.params;
        const user = req.user as AuthUser;

        if (!user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const id = parseInt(leaveRequestId, 10);
        if (isNaN(id)) {
            res.status(400).json({ message: "Invalid Leave Request ID" });
            return;
        }

        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id },
            include: {
                leaveBalance: true,
                approvals: { orderBy: { approvalLevel: "asc" } },
                ledgerEntries: { orderBy: { createdAt: "desc" }, take: 1 },
            },
        });

        if (!leaveRequest) {
            res.status(404).json({ message: "Leave request not found" });
            return;
        }

        if (leaveRequest.status !== "APPROVED") {
            res.status(400).json({ message: "PDF is only available for approved leave requests" });
            return;
        }

        // Fetch employee details
        const [adminUser, accountsUser, staffUser] = await Promise.all([
            prisma.admin.findUnique({ where: { cognitoId: leaveRequest.requesterCognitoId } }),
            prisma.accounts.findUnique({ where: { cognitoId: leaveRequest.requesterCognitoId } }),
            prisma.staff.findUnique({ where: { cognitoId: leaveRequest.requesterCognitoId } }),
        ]);

        const employee = adminUser || accountsUser || staffUser;

        // ====================== LEAVE TYPE NORMALIZATION ======================
        const leaveTypeMap: Record<string, string> = {
            ANNUAL: "Annual Leave",
            SICK: "Sick Leave",
            EMERGENCY: "Emergency Leave",
            MATERNITY: "Maternity Leave",
            PATERNITY: "Paternity Leave",
            COMPASSIONATE: "Compassionate Leave",
            OFF_DAY: "Off Day",
            STUDY: "Study Leave",
            UNPAID: "Unpaid Leave",
            PUBLIC_HOLIDAY: "Public Holiday",
            JURY_DUTY: "Jury Duty",
            BEREAVEMENT: "Bereavement Leave",
            OTHER: "Other Leave",
        };

        const normalizedLeaveType = leaveTypeMap[leaveRequest.leaveType] ||
            leaveRequest.leaveType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        const doc = new PDFDocument({
            size: 'A4',
            bufferPages: true,
            margins: { top: 100, bottom: 60, left: 60, right: 60 },
        });

        const stream = new PassThrough();
        const buffers: Buffer[] = [];

        stream.on("data", (chunk) => buffers.push(chunk));
        stream.on("end", () => {
            const pdfBuffer = Buffer.concat(buffers);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=leave-approval-${id}.pdf`);
            res.send(pdfBuffer);
        });

        doc.pipe(stream);

        const primaryColor = '#8d182c';
        const darkBrown = '#290306';
        const accentColor = '#15803d';
        const gray = '#374151';
        const lightGray = '#9ca3af';

        // ====================== HEADER ======================
        try {
            doc.image("public/images/logo.png", 48, 42, { width: 82, height: 82 });
        } catch (error) {
            console.warn("Logo not found");
        }

        doc.fillColor(darkBrown)
            .fontSize(17)
            .font('Helvetica-Bold')
            .text('Darubini Screening International Company', 145, 52, { width: 400 });

        doc.fillColor(gray)
            .fontSize(9)
            .font('Helvetica')
            .text('Leomar Court, 45 Westlands Road, Westlands', 145, 73, { width: 430 });

        doc.fillColor(gray)
            .fontSize(8.5)
            .text('P.O. Box 6079-00100 | Tel: +254 738 743008 / 0771 943023', 145, 86);

        doc.fillColor(gray)
            .fontSize(8.5)
            .text('WhatsApp: +254 721 369925 | +254 780 683290 | +254 746 730594', 145, 99);

        doc.fillColor(darkBrown)
            .fontSize(8.5)
            .text('Email: info@darubiniscreening.com', 145, 112, { continued: true })
            .fillColor(gray)
            .text(' | Web: www.darubiniscreening.com');

        doc.strokeColor(primaryColor)
            .lineWidth(2.2)
            .moveTo(50, 138)
            .lineTo(550, 138)
            .stroke();

        doc.strokeColor('#d75c68')
            .lineWidth(0.8)
            .moveTo(50, 142)
            .lineTo(550, 142)
            .stroke();

        // ====================== TITLE ======================
        let y = 175;
        doc.fillColor(primaryColor)
            .fontSize(15.5)
            .font('Helvetica-Bold')
            .text('FORM HR-015 – LEAVE/OFF-DAY REQUEST FORM', 50, y, { align: 'left', width: 495 });

        // ====================== EMPLOYEE DETAILS ======================
        y = 225;
        doc.fillColor(primaryColor)
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('Employee Details', 50, y);

        y += 25;
        const labelX = 90;
        const valueX = 255;

        doc.fontSize(10).font('Helvetica').fillColor(gray);

        doc.text('Full Name:', labelX, y);
        doc.font('Helvetica-Bold').fillColor('#111827').text(employee?.name || 'N/A', valueX, y);
        y += 22;

        doc.font('Helvetica').fillColor(gray).text('Email:', labelX, y);
        doc.font('Helvetica-Bold').fillColor('#111827').text(employee?.email || 'N/A', valueX, y);
        y += 22;

        doc.font('Helvetica').fillColor(gray).text('Phone Number:', labelX, y);
        doc.font('Helvetica-Bold').fillColor('#111827').text(employee?.phoneNumber || 'N/A', valueX, y);
        y += 22;

        doc.font('Helvetica').fillColor(gray).text('Department:', labelX, y);
        doc.font('Helvetica-Bold').fillColor('#111827').text(employee?.department || 'N/A', valueX, y);
        y += 22;

        doc.font('Helvetica').fillColor(gray).text('Supervisor:', labelX, y);
        doc.font('Helvetica-Bold').fillColor('#111827').text(employee?.supervisor || 'N/A', valueX, y);

        y = 385;

        // ====================== LEAVE DETAILS ======================
        doc.fillColor(primaryColor)
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('Leave Details', 50, y);

        y += 25;

        doc.fontSize(10).font('Helvetica').fillColor(gray);

        doc.text('Leave Type:', labelX, y);
        doc.font('Helvetica-Bold').fillColor('#111827').text(normalizedLeaveType, valueX, y);
        y += 22;

        doc.font('Helvetica').fillColor(gray).text('Period:', labelX, y);
        doc.font('Helvetica-Bold').fillColor('#111827').text(
            `${new Date(leaveRequest.startDate).toLocaleDateString('en-GB')} — ${new Date(leaveRequest.endDate).toLocaleDateString('en-GB')}`,
            valueX, y
        );
        y += 22;

        doc.font('Helvetica').fillColor(gray).text('Days Approved:', labelX, y);
        doc.font('Helvetica-Bold').fillColor('#111827').text(`${leaveRequest.daysRequested} day(s)`, valueX, y);
        y += 26;

        if (leaveRequest.reason) {
            doc.font('Helvetica').fillColor(gray).text('Reason:', labelX, y);
            doc.font('Helvetica').fillColor('#111827').text(leaveRequest.reason, valueX, y, { width: 300 });
            y += 32;
        } else {
            y += 28;
        }

        // ====================== EMPLOYEE DECLARATION ======================
        y += 35;

        doc.fillColor(primaryColor)
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('Employee Declaration', 50, y);

        y += 25;

        doc.fontSize(10)
            .font('Helvetica')
            .fillColor(gray)
            .text(
                "I confirm that the above information is accurate and understand that approval is subject to company policy and staffing needs.",
                90, y,
                { width: 420, align: 'left' }
            );

        y += 55;

        doc.font('Helvetica-Bold').fillColor(gray).text('Employee Signature:', 90, y);
        doc.text('_______________________________', 250, y);

        y += 28;
        doc.font('Helvetica-Bold').fillColor(gray).text('Date:', 90, y);
        doc.text('_______________________________', 160, y);

        // ====================== PAGE BREAK ======================
        doc.addPage();
        y = 100;

        // ====================== APPROVAL INFORMATION ======================
        doc.fillColor(primaryColor)
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('Approval Details', 50, y);

        y += 30;

        doc.fontSize(10).font('Helvetica').fillColor(gray);

        // Supervisor
        doc.text('Approved By:', labelX, y);
        doc.font('Helvetica-Bold').fillColor('#111827').text(employee?.supervisor || 'N/A', valueX, y);
        y += 28;

        doc.font('Helvetica-Bold').fillColor(gray).text('Supervisor Signature:', labelX, y);
        doc.text('_______________________________', 250, y);
        y += 28;

        doc.font('Helvetica').fillColor(gray).text('Date of Approval:', labelX, y);
        doc.font('Helvetica-Bold').fillColor('#111827').text(
            new Date().toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            valueX, y
        );

        y += 45;

        // ====================== HR DEPARTMENT USE ONLY ======================
        doc.fillColor(primaryColor)
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('HR Department Use Only', 50, y);

        y += 30;

        doc.fontSize(10).font('Helvetica').fillColor(gray);

        doc.text('HR Officer Name:', labelX, y);
        doc.font('Helvetica-Bold').fillColor('#111827').text('_______________________________', valueX, y);
        y += 28;

        doc.font('Helvetica-Bold').fillColor(gray).text('Signature:', labelX, y);
        doc.text('_______________________________', 250, y);
        y += 28;

        doc.font('Helvetica').fillColor(gray).text('Date:', labelX, y);
        doc.text('_______________________________', 160, y);

        // ====================== FOOTER ======================
        const footerY = 745;

        doc.strokeColor(lightGray)
            .lineWidth(0.6)
            .moveTo(50, footerY - 22)
            .lineTo(550, footerY - 22)
            .stroke();

        doc.fillColor(gray)
            .fontSize(9)
            .text('Facilitating Safe Recruitment Decisions.', 50, footerY - 8, {
                align: 'center',
                width: 500
            });

        doc.fillColor(lightGray)
            .fontSize(8)
            .text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 50, footerY + 12, {
                align: 'center',
                width: 500
            });

        doc.end();

        await createAuditLog(
            "DOWNLOAD_LEAVE_APPROVAL_PDF",
            id.toString(),
            user.role.toUpperCase() as PrismaUserRole,
            user.id,
            { leaveType: leaveRequest.leaveType, days: leaveRequest.daysRequested }
        );

    } catch (error: any) {
        console.error("Error generating leave PDF:", error);
        res.status(500).json({ message: "Failed to generate PDF", error: error.message });
    }
};