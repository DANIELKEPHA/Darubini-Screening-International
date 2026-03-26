"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAuditLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { entity, entityId, page = "1", limit = "10" } = req.query;
        const pageNumber = Number(page);
        const maxLimit = 100;
        const limitNumber = Math.min(Number(limit), maxLimit);
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const allowedRoles = ["admin", "accounts", "staff"];
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
        const where = Object.assign({ entity }, (entityId ? { entityId } : {}));
        const [auditLogs, total] = yield Promise.all([
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
        const actorFieldMap = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            user: "actorUserCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];
        try {
            yield prisma.auditLog.create({
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
        }
        catch (auditError) {
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
    }
    catch (error) {
        console.error("Error retrieving audit logs:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            query: req.query,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: "Internal server error" });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.getAuditLogs = getAuditLogs;
