import { Request, Response } from "express";
import { PrismaClient, Prisma, ClientName } from "@prisma/client";
import sanitizeHtml from "sanitize-html";
import csvParser from "csv-parser";
import { uploadToS3 } from "../middleware/s3Client";
import { Readable } from "stream";

const prisma = new PrismaClient();

type UserRole = "admin" | "accounts" | "staff";

interface AuthUser {
    id: string;
    role: UserRole;
}

const AUDIT_ACTOR_FIELDS = {
    admin: "actorAdminCognitoId",
    accounts: "actorAccountsCognitoId",
    staff: "actorStaffCognitoId",
} as const;

const getAuditActorField = (role: UserRole): string => {
    const field = AUDIT_ACTOR_FIELDS[role];
    if (!field) throw new Error(`Invalid role for audit: ${role}`);
    return field;
}

export const logAudit = async (
    action: "CREATE" | "READ" | "UPDATE" | "DELETE" | "BULK_CREATE",
    entity: string,
    entityId: string,
    meta: Record<string, any>,
    role: UserRole,
    cognitoId: string
) => {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                entity,
                entityId,
                meta,
                [getAuditActorField(role)]: cognitoId,
            } satisfies Prisma.AuditLogCreateInput,
        });
    } catch (error) {
        console.error("Audit log failed (non-critical):", error);
    }
};

export const importClientsFromCSV = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;
        if (!["admin", "accounts"].includes(role)) {
            res.status(403).json({ message: "Only admin and accounts can import clients" });
            return;
        }

        if (!req.file) {
            res.status(400).json({ message: "CSV file is required" });
            return;
        }

        const file = req.file as Express.Multer.File;
        if (!file.mimetype.includes("csv") && !file.originalname.endsWith(".csv")) {
            res.status(400).json({ message: "File must be a CSV" });
            return;
        }

        const results: any[] = [];
        const errors: { row: number; error: string }[] = [];
        let rowIndex = 1; // CSV rows start at 1 (skip header)

        const stream = Readable.from(file.buffer);

        await new Promise<void>((resolve, reject) => {
            stream
                .pipe(csvParser())
                .on("data", (data) => results.push(data))
                .on("error", reject)
                .on("end", resolve);
        });

        const createdClients: any[] = [];

        for (const row of results) {
            rowIndex++;
            try {
                const {
                    clientName,
                    customClientName,
                    contactEmail,
                    contactPhone,
                    address,
                    kraPin,
                    isActive = "true",
                    imageUrl: externalImageUrl, // optional: direct image URL in CSV
                } = row;

                // === Validation (same as single create) ===
                if (!clientName?.trim() && !customClientName?.trim()) {
                    errors.push({ row: rowIndex, error: "clientName or customClientName required" });
                    continue;
                }

                if (clientName && !Object.values(ClientName).includes(clientName.trim() as ClientName)) {
                    errors.push({ row: rowIndex, error: `Invalid clientName: ${clientName}` });
                    continue;
                }

                if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
                    errors.push({ row: rowIndex, error: `Invalid email: ${contactEmail}` });
                    continue;
                }

                let finalImageUrl: string | null = null;

                // Option 1: Upload image from external URL
                if (externalImageUrl?.trim()) {
                    try {
                        const response = await fetch(externalImageUrl.trim());
                        if (!response.ok) throw new Error("Failed to fetch image");
                        const buffer = Buffer.from(await response.arrayBuffer());
                        const ext = response.headers.get("content-type")?.split("/")[1] || "png";
                        const filename = `csv-import-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                        const { url } = await uploadToS3(buffer, filename, response.headers.get("content-type") || "image/png");
                        finalImageUrl = url;
                    } catch (imgErr) {
                        errors.push({ row: rowIndex, error: `Failed to download image: ${externalImageUrl}` });
                    }
                }

                // === Create Client ===
                const client = await prisma.clientList.create({
                    data: {
                        clientName: clientName?.trim() as ClientName | undefined,
                        customClientName: customClientName ? sanitizeHtml(customClientName.trim()) : null,
                        contactEmail: contactEmail ? sanitizeHtml(contactEmail.trim()) : null,
                        contactPhone: contactPhone ? sanitizeHtml(contactPhone.trim()) : null,
                        address: address ? sanitizeHtml(address.trim()) : null,
                        kraPin: kraPin ? sanitizeHtml(kraPin.trim()) : null,
                        isActive: (isActive?.toString().toLowerCase() === "true" || isActive === "1"),
                        imageUrl: finalImageUrl,
                        [role === "admin" ? "createdByAdmin" : "createdByAccounts"]: {
                            connect: { cognitoId },
                        },
                    },
                    select: { id: true, customClientName: true, clientName: true },
                });

                createdClients.push(client);
            } catch (err: any) {
                errors.push({ row: rowIndex, error: err.message || "Unknown error" });
            }
        }

        // === Audit Bulk Import ===
        await logAudit(
            "BULK_CREATE",
            "ClientList",
            "csv-import",
            {
                totalRows: results.length,
                successful: createdClients.length,
                failed: errors.length,
                fileName: file.originalname,
            },
            role,
            cognitoId
        );

        res.status(200).json({
            message: "CSV import completed",
            successful: createdClients.length,
            failed: errors.length,
            created: createdClients.map(c => ({ id: c.id, name: c.customClientName || c.clientName })),
            errors,
        });
    } catch (error: any) {
        console.error("CSV import failed:", error);
        res.status(500).json({ message: "CSV import failed", error: error.message });
    }
};

export const createClient = async (req: Request, res: Response): Promise<void> => {
    try {
        // === Auth ===
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;

        if (!["admin", "accounts", "staff"].includes(role)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }

        // === Image Upload ===
        let imageUrl: string | null = null;

        if (req.file) {
            const file = req.file as Express.Multer.File;
            const { url } = await uploadToS3(file.buffer, file.originalname, file.mimetype);
            imageUrl = url;
        }

        // === Form Data ===
        const {
            clientName,
            customClientName,
            contactEmail,
            contactPhone,
            address,
            kraPin,
            isActive = "true",
        } = req.body as Record<string, string>;

        // === Validation ===
        if (!clientName && !customClientName) {
            res.status(400).json({ message: "clientName or customClientName is required" });
            return;
        }

        if (clientName && !Object.values(ClientName).includes(clientName as ClientName)) {
            res.status(400).json({ message: "Invalid predefined client name" });
            return;
        }

        if (customClientName && (customClientName.length < 1 || customClientName.length > 100)) {
            res.status(400).json({ message: "Custom client name must be 1–100 characters" });
            return;
        }

        if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
            res.status(400).json({ message: "Invalid email" });
            return;
        }

        // === Create Client ===
        const data: Prisma.ClientListCreateInput = {
            clientName: clientName as ClientName | undefined,
            customClientName: customClientName ? sanitizeHtml(customClientName) : null,
            contactEmail: contactEmail ? sanitizeHtml(contactEmail) : null,
            contactPhone: contactPhone ? sanitizeHtml(contactPhone) : null,
            address: address ? sanitizeHtml(address) : null,
            kraPin: kraPin ? sanitizeHtml(kraPin) : null,
            isActive: isActive === "true",
            imageUrl,
            [role === "admin" ? "createdByAdmin" : role === "accounts" ? "createdByAccounts" : "createdByStaff"]: {
                connect: { cognitoId },
            },
        };

        const client = await prisma.clientList.create({
            data,
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
            },
        });

        // === Audit & Response ===
        await logAudit(
            "CREATE",
            "ClientList",
            client.id.toString(),
            {
                clientName: client.customClientName || client.clientName || "Unnamed",
                hasImage: !!imageUrl,
            },
            role,
            cognitoId
        );

        res.status(201).json(client);
    } catch (error: any) {
        console.error("createClient failed:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
};

export const getClients = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;

        if (!["admin", "accounts", "staff"].includes(role)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 10);

        const [clients, total] = await Promise.all([
            prisma.clientList.findMany({
                where: { deletedAt: null },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    clientName: true,
                    customClientName: true,
                    contactEmail: true,
                    contactPhone: true,
                    address: true,
                    kraPin: true,
                    isActive: true,
                    imageUrl: true,
                    createdAt: true,
                    updatedAt: true,
                    deletedAt: true,
                    createdByAdmin: true,
                    createdByAccounts: true,
                    createdByStaff: true,
                },
            }),
            prisma.clientList.count({ where: { deletedAt: null } }),
        ]);

        logAudit("READ", "ClientList", "multiple", { count: clients.length, page, limit }, role, cognitoId);

        res.json({
            clients,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        });
    } catch (error) {
        console.error("Error retrieving clients:", error);
        if (!res.headersSent) res.status(500).json({ message: "Internal server error" });
    }
};

export const getClient = async (req: Request, res: Response): Promise<void> => {
    try {
        // === Authentication & Authorization ===
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;

        if (!["admin", "accounts", "staff"].includes(role)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }

        const idNumber = Number(req.params.id);
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid client ID" });
            return;
        }

        const client = await prisma.clientList.findUnique({
            where: { id: idNumber, deletedAt: null },
            select: {
                id: true,
                clientName: true,
                customClientName: true,
                contactEmail: true,
                contactPhone: true,
                address: true,
                kraPin: true,
                isActive: true,
                imageUrl: true,
                createdAt: true,
                updatedAt: true,
                deletedAt: true,
                createdByAdmin: { select: { name: true, email: true } },
                createdByAccounts: { select: { name: true, email: true } },
                createdByStaff: { select: { name: true, email: true } },
            },
        });

        if (!client) {
            res.status(404).json({ message: "Client not found" });
            return;
        }

        // === Audit Log ===
        await logAudit(
            "READ",
            "ClientList",
            idNumber.toString(),
            {
                clientId: idNumber,
                clientName: client.customClientName || client.clientName || "Unknown",
                hasImage: !!client.imageUrl,
            },
            role,
            cognitoId
        );

        // === Success ===
        res.json(client);
    } catch (error: any) {
        console.error("getClient failed:", {
            error: error.message,
            clientId: req.params.id,
            userId: req.user?.id,
        });

        if (!res.headersSent) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
};

export const updateClient = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;

        if (!["admin", "accounts", "staff"].includes(role)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }

        const idNumber = Number(req.params.id);
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid client ID" });
            return;
        }

        const existing = await prisma.clientList.findUnique({
            where: { id: idNumber, deletedAt: null },
            select: { id: true, imageUrl: true },
        });

        if (!existing) {
            res.status(404).json({ message: "Client not found" });
            return;
        }

        let imageUrl = existing.imageUrl;

        if (req.file) {
            const file = req.file as Express.Multer.File;
            const { url } = await uploadToS3(file.buffer, file.originalname, file.mimetype);
            imageUrl = url;
        }

        const {
            clientName,
            contactEmail,
            contactPhone,
            address,
            kraPin,
            isActive,
        } = req.body as Record<string, string>;

        if (clientName && !Object.values(ClientName).includes(clientName as ClientName)) {
            res.status(400).json({ message: "Invalid client name" });
            return;
        }

        if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
            res.status(400).json({ message: "Invalid email" });
            return;
        }

        const data: Prisma.ClientListUpdateInput = {
            ...(clientName && { clientName: clientName as ClientName }),
            ...(contactEmail !== undefined && { contactEmail: contactEmail ? sanitizeHtml(contactEmail) : null }),
            ...(contactPhone !== undefined && { contactPhone: contactPhone ? sanitizeHtml(contactPhone) : null }),
            ...(address !== undefined && { address: address ? sanitizeHtml(address) : null }),
            ...(kraPin !== undefined && { kraPin: kraPin ? sanitizeHtml(kraPin) : null }),
            ...(isActive !== undefined && { isActive: isActive === "true" }),
            ...(imageUrl !== existing.imageUrl && { imageUrl }),
        };

        const updatedClient = await prisma.clientList.update({
            where: { id: idNumber },
            data,
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
            },
        });

        await logAudit("UPDATE", "ClientList", idNumber.toString(), {
            updatedFields: Object.keys(data),
            clientName: updatedClient.customClientName || updatedClient.clientName,
            hasImageUpdated: imageUrl !== existing.imageUrl,
        }, role, cognitoId);

        res.json(updatedClient);
    } catch (error) {
        console.error("Error updating client:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteClient = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;

        if (!["admin", "accounts", "staff"].includes(role)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }

        const idNumber = Number(req.params.id);
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid client ID" });
            return;
        }

        const client = await prisma.clientList.findUnique({
            where: { id: idNumber, deletedAt: null },
        });

        if (!client) {
            res.status(404).json({ message: "Client not found" });
            return;
        }

        const updatedClient = await prisma.clientList.update({
            where: { id: idNumber },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
            },
        });

        // Audit log
        await logAudit(
            "DELETE",
            "ClientList",
            idNumber.toString(),
            {
                clientName: client.customClientName || client.clientName,
            },
            role,
            cognitoId
        );

        // Success response
        res.json({
            message: "Client soft-deleted successfully",
            client: updatedClient,
        });
    } catch (error: any) {
        console.error("Error deleting client:", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "Client not found" });
        } else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
};

