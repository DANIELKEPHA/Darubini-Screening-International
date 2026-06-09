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