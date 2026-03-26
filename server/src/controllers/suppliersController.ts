import { PrismaClient, Prisma } from "@prisma/client";
import { Request, Response } from "express";
import sanitizeHtml from "sanitize-html";

const prisma = new PrismaClient();

type UserRole = "admin" | "user" | "accounts" | "staff";

interface AuthUser {
    id: string;
    role: UserRole;
}

export const getSuppliers = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        // Allow only admin and accounts roles to view suppliers
        const allowedRoles: UserRole[] = ["admin", "accounts"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to view suppliers` });
            return;
        }

        const suppliers = await prisma.supplier.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                contactPerson: true,
                phone: true,
                address: true,
                kraPin: true,
            },
        });

        if (suppliers.length === 0) {
            res.status(404).json({ message: "No suppliers found" });
            return;
        }

        res.json(suppliers);
    } catch (error) {
        console.error("Error retrieving suppliers:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: "Internal server error" });
    } finally {
        await prisma.$disconnect();
    }
};

export const createSupplier = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, contactPerson, phone, address, kraPin } = req.body as {
            name?: string;
            email?: string;
            contactPerson?: string;
            phone?: string;
            address?: string;
            kraPin?: string;
        };

        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        // Allow only admin and accounts roles to create suppliers
        const allowedRoles: UserRole[] = ["admin", "accounts"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to create suppliers` });
            return;
        }

        if (!name || typeof name !== "string" || name.length > 100) {
            res.status(400).json({ message: "Name must be a string, 100 characters or less" });
            return;
        }

        if (email && (typeof email !== "string" || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/.test(email))) {
            res.status(400).json({ message: "Invalid email format" });
            return;
        }

        const supplier = await prisma.supplier.create({
            data: {
                name: sanitizeHtml(name),
                email: email ? sanitizeHtml(email) : null,
                contactPerson: contactPerson ? sanitizeHtml(contactPerson) : null,
                phone: phone ? sanitizeHtml(phone) : null,
                address: address ? sanitizeHtml(address) : null,
                kraPin: kraPin ? sanitizeHtml(kraPin) : null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                contactPerson: true,
                phone: true,
                address: true,
                kraPin: true,
            },
        });

        // Map role to audit log actor field
        const actorFieldMap: Record<UserRole, string> = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            user: "actorUserCognitoId", // Not used due to role restriction
            staff: "actorStaffCognitoId", // Not used due to role restriction
        };
        const actorField = actorFieldMap[role];

        await prisma.auditLog.create({
            data: {
                action: "CREATE",
                entity: "Supplier",
                entityId: supplier.id.toString(),
                meta: { supplier },
                [actorField]: cognitoId,
            },
        });

        res.status(201).json(supplier);
    } catch (error) {
        console.error("Error creating supplier:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            body: req.body,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: "Internal server error" });
    } finally {
        await prisma.$disconnect();
    }
};

export const updateSupplier = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, email, contactPerson, phone, address, kraPin } = req.body as {
            name?: string;
            email?: string;
            contactPerson?: string;
            phone?: string;
            address?: string;
            kraPin?: string;
        };

        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        // Allow only admin and accounts roles to update suppliers
        const allowedRoles: UserRole[] = ["admin", "accounts"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to update suppliers` });
            return;
        }

        if (name && (typeof name !== "string" || name.length > 100)) {
            res.status(400).json({ message: "Name must be a string, 100 characters or less" });
            return;
        }

        if (email && (typeof email !== "string" || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/.test(email))) {
            res.status(400).json({ message: "Invalid email format" });
            return;
        }

        const supplier = await prisma.supplier.update({
            where: { id: parseInt(id) },
            data: {
                name: name ? sanitizeHtml(name) : undefined,
                email: email ? sanitizeHtml(email) : null,
                contactPerson: contactPerson ? sanitizeHtml(contactPerson) : null,
                phone: phone ? sanitizeHtml(phone) : null,
                address: address ? sanitizeHtml(address) : null,
                kraPin: kraPin ? sanitizeHtml(kraPin) : null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                contactPerson: true,
                phone: true,
                address: true,
                kraPin: true,
            },
        });

        // Map role to audit log actor field
        const actorFieldMap: Record<UserRole, string> = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            user: "actorUserCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];

        await prisma.auditLog.create({
            data: {
                action: "UPDATE",
                entity: "Supplier",
                entityId: supplier.id.toString(),
                meta: { supplier },
                [actorField]: cognitoId,
            },
        });

        res.json(supplier);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "Supplier not found" });
            return;
        }
        console.error("Error updating supplier:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            body: req.body,
            params: req.params,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: "Internal server error" });
    } finally {
        await prisma.$disconnect();
    }
};

export const deleteSupplier = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        // Allow only admin and accounts roles to delete suppliers
        const allowedRoles: UserRole[] = ["admin", "accounts"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to delete suppliers` });
            return;
        }

        const supplier = await prisma.supplier.delete({
            where: { id: parseInt(id) },
            select: { id: true, name: true },
        });

        // Map role to audit log actor field
        const actorFieldMap: Record<UserRole, string> = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            user: "actorUserCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];

        await prisma.auditLog.create({
            data: {
                action: "DELETE",
                entity: "Supplier",
                entityId: supplier.id.toString(),
                meta: { supplier },
                [actorField]: cognitoId,
            },
        });

        res.json({ message: "Supplier deleted successfully", supplier });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "Supplier not found" });
            return;
        }
        console.error("Error deleting supplier:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            params: req.params,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: "Internal server error" });
    } finally {
        await prisma.$disconnect();
    }
};