import { PrismaClient, Prisma } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

type UserRole = "admin" | "user" | "accounts" | "staff";

interface AuthUser {
    id: string;
    role: UserRole;
}

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const { entity, entityId, page = "1", limit = "10" } = req.query;
        const pageNumber = Number(page);
        const maxLimit = 100;
        const limitNumber = Math.min(Number(limit), maxLimit);

        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        const allowedRoles: UserRole[] = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to view audit logs` });
            return;
        }

        if (!entity || typeof entity !== "string") {
            res.status(400).json({ message: "Entity is required and must be a string" });
            return;
        }
        if (entityId && typeof entityId !== "string") {
            res.status(400).json({ message: "Entity ID must be a string if provided" });
            return;
        }
        if (isNaN(pageNumber) || pageNumber < 1) {
            res.status(400).json({ message: "Invalid page parameter" });
            return;
        }
        if (isNaN(limitNumber) || limitNumber < 1) {
            res.status(400).json({ message: "Invalid limit parameter" });
            return;
        }

        const where: Prisma.AuditLogWhereInput = {
            entity,
            ...(entityId ? { entityId } : {}), // Only include entityId if provided
        };

        const [auditLogs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (pageNumber - 1) * limitNumber,
                take: limitNumber,
                include: {
                    actorUser: true,
                    actorAdmin: true,
                    actorAccounts: true,
                    actorStaff: true,
                },
            }),
            prisma.auditLog.count({ where }),
        ]);

        const actorFieldMap: Record<UserRole, string> = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            user: "actorUserCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];

        try {
            await prisma.auditLog.create({
                data: {
                    action: "READ",
                    entity: "AuditLog",
                    entityId: entityId ? `${entity}:${entityId}` : entity,
                    meta: {
                        entity,
                        entityId: entityId || null,
                        count: auditLogs.length,
                        page: pageNumber,
                        limit: limitNumber,
                        role,
                        cognitoId,
                    },
                    [actorField]: cognitoId,
                },
            });
        } catch (auditError) {
            console.warn("Failed to create audit log for audit log retrieval:", {
                message: auditError instanceof Error ? auditError.message : "Unknown error",
                stack: auditError instanceof Error ? auditError.stack : undefined,
                query: req.query,
                user: req.user,
                timestamp: new Date().toISOString(),
            });
        }

        res.json({
            data: auditLogs,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
            total,
        });
    } catch (error) {
        console.error("Error retrieving audit logs:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            query: req.query,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: "Internal server error" });
    } finally {
        await prisma.$disconnect();
    }
};