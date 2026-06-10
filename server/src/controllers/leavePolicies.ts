import { Request, Response } from "express";
import { PrismaClient, UserRole as PrismaUserRole } from "@prisma/client";

const prisma = new PrismaClient();

const normalizeRole = (role: string): PrismaUserRole => {
    const normalized = role.toUpperCase() as PrismaUserRole;

    if (!["ADMIN", "ACCOUNTS", "STAFF"].includes(normalized)) {
        throw new Error(`Invalid role: ${role}`);
    }

    return normalized;
};

const ALLOWED_ROLES: PrismaUserRole[] = ["ADMIN", "ACCOUNTS", "STAFF"];

export const createOrUpdateLeavePolicies = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const admin = req.user as any;

        if (!admin || admin.role !== "admin") {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        const {
            year,
            policies
        } = req.body;

        if (!year || !Array.isArray(policies)) {
            res.status(400).json({
                message: "year and policies array are required",
            });
            return;
        }

        const results = await Promise.all(
            policies.map(async (p: any) => {
                const role = normalizeRole(p.role);

                if (!ALLOWED_ROLES.includes(role)) {
                    throw new Error(`Invalid role: ${p.role}`);
                }

                return prisma.leavePolicy.upsert({
                    where: {
                        year_role: {
                            year: Number(year),
                            role,
                        },
                    },
                    update: {
                        annualLeaveDays: p.annualLeaveDays ?? 21,
                        sickLeaveDays: p.sickLeaveDays ?? 10,
                        compassionateDays: p.compassionateDays ?? 5,
                        maternityDays: p.maternityDays ?? 90,
                        paternityDays: p.paternityDays ?? 14,
                        emergencyDays: p.emergencyDays ?? 5,
                        studyLeaveDays: p.studyLeaveDays ?? null,
                        unpaidLeaveAllowed: p.unpaidLeaveAllowed ?? true,
                        workingDaysPerWeek: p.workingDaysPerWeek ?? 5,
                        includeWeekends: p.includeWeekends ?? false,
                        excludeHolidays: p.excludeHolidays ?? true,
                        updatedAt: new Date(),
                    },
                    create: {
                        year: Number(year),
                        role,

                        annualLeaveDays: p.annualLeaveDays ?? 21,
                        sickLeaveDays: p.sickLeaveDays ?? 10,
                        compassionateDays: p.compassionateDays ?? 5,
                        maternityDays: p.maternityDays ?? 90,
                        paternityDays: p.paternityDays ?? 14,
                        emergencyDays: p.emergencyDays ?? 5,
                        studyLeaveDays: p.studyLeaveDays ?? null,
                        unpaidLeaveAllowed: p.unpaidLeaveAllowed ?? true,
                        workingDaysPerWeek: p.workingDaysPerWeek ?? 5,
                        includeWeekends: p.includeWeekends ?? false,
                        excludeHolidays: p.excludeHolidays ?? true,
                    },
                });
            })
        );

        res.status(201).json({
            message: "Leave policies created/updated successfully",
            year,
            policies: results,
        });

    } catch (error: any) {
        console.error("createOrUpdateLeavePolicies error:", error);

        res.status(500).json({
            message: "Failed to create/update leave policies",
            error: error.message,
        });
    }
};

export const initializeLeaveBalances = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const admin = req.user as any;

        if (!admin || admin.role !== "admin") {
            res.status(403).json({
                message: "Access denied",
            });
            return;
        }

        const { year } = req.body;

        if (!year) {
            res.status(400).json({
                message: "Year is required",
            });
            return;
        }

        const targetYear = Number(year);

        const policies = await prisma.leavePolicy.findMany({
            where: {
                year: targetYear,
            },
        });

        if (!policies.length) {
            res.status(404).json({
                message: `No leave policies found for ${targetYear}`,
            });
            return;
        }

        const policyMap = new Map<
            PrismaUserRole,
            (typeof policies)[number]
        >();

        policies.forEach((policy) => {
            policyMap.set(policy.role, policy);
        });

        const [admins, accountsUsers, staffUsers] =
            await Promise.all([
                prisma.admin.findMany({
                    select: {
                        cognitoId: true,
                    },
                }),

                prisma.accounts.findMany({
                    select: {
                        cognitoId: true,
                    },
                }),

                prisma.staff.findMany({
                    select: {
                        cognitoId: true,
                    },
                }),
            ]);

        const users = [
            ...admins.map((user) => ({
                cognitoId: user.cognitoId,
                role: "ADMIN" as PrismaUserRole,
            })),

            ...accountsUsers.map((user) => ({
                cognitoId: user.cognitoId,
                role: "ACCOUNTS" as PrismaUserRole,
            })),

            ...staffUsers.map((user) => ({
                cognitoId: user.cognitoId,
                role: "STAFF" as PrismaUserRole,
            })),
        ];

        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        for (const user of users) {
            const policy = policyMap.get(user.role);

            if (!policy) {
                skippedCount++;
                continue;
            }

            const existingBalance =
                await prisma.leaveBalance.findUnique({
                    where: {
                        cognitoId_year: {
                            cognitoId: user.cognitoId,
                            year: targetYear,
                        },
                    },
                });

            if (existingBalance) {
                updatedCount++;

                await prisma.leaveBalance.update({
                    where: {
                        id: existingBalance.id,
                    },
                    data: {
                        role: user.role,

                        annualEntitled:
                        policy.annualLeaveDays,

                        sickEntitled:
                        policy.sickLeaveDays,

                        compassionateEntitled:
                        policy.compassionateDays,

                        emergencyEntitled:
                        policy.emergencyDays,
                    },
                });

                continue;
            }

            await prisma.leaveBalance.create({
                data: {
                    cognitoId: user.cognitoId,
                    role: user.role,
                    year: targetYear,

                    annualEntitled:
                    policy.annualLeaveDays,
                    annualUsed: 0,
                    annualRemaining:
                    policy.annualLeaveDays,

                    sickEntitled:
                    policy.sickLeaveDays,
                    sickUsed: 0,
                    sickRemaining:
                    policy.sickLeaveDays,

                    compassionateEntitled:
                    policy.compassionateDays,
                    compassionateUsed: 0,
                    compassionateRemaining:
                    policy.compassionateDays,

                    emergencyEntitled:
                    policy.emergencyDays,
                    emergencyUsed: 0,
                    emergencyRemaining:
                    policy.emergencyDays,

                    isLocked: false,
                },
            });

            createdCount++;
        }

        res.status(200).json({
            success: true,
            message: "Leave balances initialized successfully",
            year: targetYear,

            summary: {
                totalUsers: users.length,
                created: createdCount,
                updated: updatedCount,
                skipped: skippedCount,
            },
        });
    } catch (error: any) {
        console.error(
            "initializeLeaveBalances error:",
            error
        );

        res.status(500).json({
            message: "Failed to initialize leave balances",
            error: error.message,
        });
    }
};