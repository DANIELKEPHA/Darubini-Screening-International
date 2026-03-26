import { PrismaClient, Prisma, ExpenseType } from "@prisma/client";
import { Request, Response } from "express";
import {DeleteObjectCommand, GetObjectCommand} from "@aws-sdk/client-s3";
import {s3Client, uploadToS3} from "../middleware/s3Client";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

const prisma = new PrismaClient();

type UserRole = "admin" | "user" | "accounts" | "staff";

interface AuthUser {
    id: string;
    role: UserRole;
}

export const uploadProofFile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        const allowedRoles: UserRole[] = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized` });
            return;
        }

        // ────── FIX: Convert string IDs → numbers ──────
        const clientExpenseId = req.body.clientExpenseId
            ? Number(req.body.clientExpenseId)
            : undefined;
        const operationalExpenseId = req.body.operationalExpenseId
            ? Number(req.body.operationalExpenseId)
            : undefined;
        const quotationId = req.body.quotationId
            ? Number(req.body.quotationId)
            : undefined;
        const expenseType = req.body.expenseType as ExpenseType | undefined;

        // ───────────────────────────────────────────────

        const file = req.file;
        if (!file) {
            res.status(400).json({ message: "No file uploaded" });
            return;
        }

        const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            res.status(400).json({ message: "Invalid file type. Only JPEG, PNG, WebP, or PDF allowed" });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            res.status(400).json({ message: "File size exceeds 5MB limit" });
            return;
        }

        const entityIds = [clientExpenseId, operationalExpenseId, quotationId].filter(
            (id): id is number => typeof id === "number"
        );
        if (entityIds.length !== 1) {
            res.status(400).json({
                message: "Exactly one of clientExpenseId, operationalExpenseId, or quotationId must be provided",
            });
            return;
        }

        if (expenseType && !["CLIENT", "OPERATIONAL"].includes(expenseType)) {
            res.status(400).json({ message: "Invalid expense type" });
            return;
        }

        let entityName = "";

        // ────── Now safe: IDs are numbers! ──────
        if (clientExpenseId !== undefined) {
            const expense = await prisma.clientExpense.findUnique({
                where: { id: clientExpenseId },
            });
            if (!expense) {
                res.status(404).json({ message: "Client expense not found" });
                return;
            }
            if (role === "staff" && expense.createdByStaffCognitoId !== cognitoId) {
                res.status(403).json({ message: "Access denied: Not your expense" });
                return;
            }
            entityName = "ClientExpense";
        } else if (operationalExpenseId !== undefined) {
            const expense = await prisma.operationalExpense.findUnique({
                where: { id: operationalExpenseId },
            });
            if (!expense) {
                res.status(404).json({ message: "Operational expense not found" });
                return;
            }
            if (role === "staff" && expense.createdByStaffCognitoId !== cognitoId && expense.expenseStatus === "DRAFT") {
                res.status(403).json({ message: "Access denied: Cannot modify another user's draft" });
                return;
            }
            entityName = "OperationalExpense";
        } else if (quotationId !== undefined) {
            const quotation = await prisma.quotation.findUnique({
                where: { id: quotationId },
            });
            if (!quotation) {
                res.status(404).json({ message: "Quotation not found" });
                return;
            }
            if (role === "staff" && quotation.createdByStaffCognitoId !== cognitoId) {
                res.status(403).json({ message: "Access denied: Not your quotation" });
                return;
            }
            entityName = "Quotation";
        }
        // ────────────────────────────────────────

        const { key, url } = await uploadToS3(file.buffer, file.originalname, file.mimetype);

        const data: Prisma.ProofFileCreateInput = {
            expenseType: expenseType || undefined,
            clientExpense: clientExpenseId ? { connect: { id: clientExpenseId } } : undefined,
            operationalExpense: operationalExpenseId ? { connect: { id: operationalExpenseId } } : undefined,
            quotation: quotationId ? { connect: { id: quotationId } } : undefined,
            s3Key: key,
            url,

            ...(role === "admin" && {
                uploadedByAdmin: { connect: { cognitoId } },
            }),
            ...(role === "accounts" && {
                uploadedByAccounts: { connect: { cognitoId } },
            }),
            ...(role === "staff" && {
                uploadedByStaff: { connect: { cognitoId } },
            }),
        };

        const proofFile = await prisma.proofFile.create({ data });

        // Audit log
        const actorFieldMap: Record<UserRole, string> = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            staff: "actorStaffCognitoId",
            user: "actorUserCognitoId",
        };

        await prisma.auditLog.create({
            data: {
                action: "UPLOAD_PROOF_FILE",
                entity: "ProofFile",
                entityId: proofFile.id.toString(),
                meta: {
                    fileName: file.originalname,
                    s3Key: key,
                    entityName,
                    entityId: entityIds[0].toString(),
                    role,
                    cognitoId,
                },
                [actorFieldMap[role]]: cognitoId,
            },
        });

        res.status(201).json(proofFile);
    } catch (error) {
        console.error("Error uploading proof file:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            body: req.body,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: "Internal server error" });
    } finally {
        await prisma.$disconnect();
    }
};

export const getProofFiles = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        const allowedRoles: UserRole[] = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to access proof files` });
            return;
        }

        const {
            page = "1",
            limit = "10",
            expenseType,
            clientExpenseId,
            operationalExpenseId,
            quotationId,
        } = req.query as {
            page?: string;
            limit?: string;
            expenseType?: ExpenseType;
            clientExpenseId?: string;
            operationalExpenseId?: string;
            quotationId?: string;
        };

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
            res.status(400).json({ message: "Invalid page or limit parameters" });
            return;
        }

        const where: Prisma.ProofFileWhereInput = {};

        if (expenseType) {
            if (!["CLIENT", "OPERATIONAL"].includes(expenseType)) {
                res.status(400).json({ message: "Invalid expense type" });
                return;
            }
            where.expenseType = expenseType;
        }

        if (clientExpenseId) {
            const id = parseInt(clientExpenseId, 10);
            if (isNaN(id)) {
                res.status(400).json({ message: "Invalid clientExpenseId" });
                return;
            }
            where.clientExpenseId = id;
        }

        if (operationalExpenseId) {
            const id = parseInt(operationalExpenseId, 10);
            if (isNaN(id)) {
                res.status(400).json({ message: "Invalid operationalExpenseId" });
                return;
            }
            where.operationalExpenseId = id;
        }

        if (quotationId) {
            const id = parseInt(quotationId, 10);
            if (isNaN(id)) {
                res.status(400).json({ message: "Invalid quotationId" });
                return;
            }
            where.quotationId = id;
        }

        if (role === "staff") {
            where.OR = [
                { uploadedByStaff: { cognitoId } },
                {
                    clientExpense: { createdByStaffCognitoId: cognitoId },
                },
                {
                    operationalExpense: { createdByStaffCognitoId: cognitoId },
                },
                {
                    quotation: { createdByStaffCognitoId: cognitoId },
                },
            ];
        }

        const [proofFiles, total] = await Promise.all([
            prisma.proofFile.findMany({
                where,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                orderBy: { createdAt: "desc" },
                include: {
                    clientExpense: { select: { id: true } },
                    operationalExpense: { select: { id: true } },
                    quotation: { select: { id: true } },
                    uploadedByAdmin: { select: { cognitoId: true, name: true } },
                    uploadedByAccounts: { select: { cognitoId: true, name: true } },
                    uploadedByStaff: { select: { cognitoId: true, name: true } },
                },
            }),
            prisma.proofFile.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limitNum);

        res.status(200).json({
            data: proofFiles,
            page: pageNum,
            limit: limitNum,
            totalPages,
            total,
        });
    } catch (error) {
        console.error("Error fetching proof files:", {
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

export const deleteProofFile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        const allowedRoles: UserRole[] = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to delete proof files` });
            return;
        }

        const { id } = req.params;
        const proofFileId = parseInt(id, 10);
        if (isNaN(proofFileId)) {
            res.status(400).json({ message: "Invalid proof file ID" });
            return;
        }

        const proofFile = await prisma.proofFile.findUnique({
            where: { id: proofFileId },
            include: {
                clientExpense: { select: { createdByStaffCognitoId: true } },
                operationalExpense: { select: { createdByStaffCognitoId: true, expenseStatus: true } },
                quotation: { select: { createdByStaffCognitoId: true } },
                uploadedByStaff: { select: { cognitoId: true } },
            },
        });

        if (!proofFile) {
            res.status(404).json({ message: "Proof file not found" });
            return;
        }

        if (role === "staff") {
            const isUploader = proofFile.uploadedByStaff?.cognitoId === cognitoId;
            const isCreator =
                proofFile.clientExpense?.createdByStaffCognitoId === cognitoId ||
                proofFile.operationalExpense?.createdByStaffCognitoId === cognitoId ||
                proofFile.quotation?.createdByStaffCognitoId === cognitoId;
            const isDraftOperational =
                proofFile.operationalExpense?.expenseStatus === "DRAFT";

            if (!isUploader && !isCreator && isDraftOperational) {
                res.status(403).json({
                    message: "Access denied: Cannot delete proof file for draft expense created by another user",
                });
                return;
            }
        }

        const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: proofFile.s3Key,
        };

        try {
            await s3Client.send(new DeleteObjectCommand(deleteParams));
        } catch (s3Error) {
            console.error("Error deleting file from S3:", {
                message: s3Error instanceof Error ? s3Error.message : "Unknown error",
                stack: s3Error instanceof Error ? s3Error.stack : undefined,
                timestamp: new Date().toISOString(),
            });
            res.status(500).json({ message: "Failed to delete file from storage" });
            return;
        }

        await prisma.proofFile.delete({
            where: { id: proofFileId },
        });

        const actorFieldMap: Record<UserRole, string> = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            user: "actorUserCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];

        await prisma.auditLog.create({
            data: {
                action: "DELETE_PROOF_FILE",
                entity: "ProofFile",
                entityId: proofFileId.toString(),
                meta: {
                    s3Key: proofFile.s3Key,
                    role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting proof file:", {
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

export const getProofFileById = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        const allowedRoles: UserRole[] = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {

            res.status(403).json({ message: `Access denied: Role ${role} not authorized to access proof files` });
            return;
        }

        const { id } = req.params;
        const proofFileId = parseInt(id, 10);
        if (isNaN(proofFileId)) {
            res.status(400).json({ message: "Invalid proof file ID" });
            return;
        }

        const proofFile = await prisma.proofFile.findUnique({
            where: { id: proofFileId },
            include: {
                clientExpense: { select: { id: true, createdByStaffCognitoId: true } },
                operationalExpense: { select: { id: true, createdByStaffCognitoId: true, expenseStatus: true } },
                quotation: { select: { id: true, createdByStaffCognitoId: true } },
                uploadedByAdmin: { select: { cognitoId: true, name: true } },
                uploadedByAccounts: { select: { cognitoId: true, name: true } },
                uploadedByStaff: { select: { cognitoId: true, name: true } },
            },
        });

        if (!proofFile) {
            res.status(404).json({ message: "Proof file not found" });
            return;
        }

        if (role === "staff") {
            const isUploader = proofFile.uploadedByStaff?.cognitoId === cognitoId;
            const isCreator =
                proofFile.clientExpense?.createdByStaffCognitoId === cognitoId ||
                proofFile.operationalExpense?.createdByStaffCognitoId === cognitoId ||
                proofFile.quotation?.createdByStaffCognitoId === cognitoId;

            if (!isUploader && !isCreator) {
                res.status(403).json({
                    message: "Access denied: Cannot access proof file uploaded or created by another user",
                });
                return;
            }
        }

        res.status(200).json(proofFile);
    } catch (error) {
        console.error("Error fetching proof file:", {
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

export const downloadProofFile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user as AuthUser;

        const allowedRoles: UserRole[] = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to download proof files` });
            return;
        }

        const { id } = req.params;
        const proofFileId = parseInt(id, 10);
        if (isNaN(proofFileId)) {
            res.status(400).json({ message: "Invalid proof file ID" });
            return;
        }

        const proofFile = await prisma.proofFile.findUnique({
            where: { id: proofFileId },
            include: {
                clientExpense: { select: { id: true, createdByStaffCognitoId: true } },
                operationalExpense: { select: { id: true, createdByStaffCognitoId: true, expenseStatus: true } },
                quotation: { select: { id: true, createdByStaffCognitoId: true } },
                uploadedByStaff: { select: { cognitoId: true } },
            },
        });

        if (!proofFile) {
            res.status(404).json({ message: "Proof file not found" });
            return;
        }

        if (role === "staff") {
            const isUploader = proofFile.uploadedByStaff?.cognitoId === cognitoId;
            const isCreator =
                proofFile.clientExpense?.createdByStaffCognitoId === cognitoId ||
                proofFile.operationalExpense?.createdByStaffCognitoId === cognitoId ||
                proofFile.quotation?.createdByStaffCognitoId === cognitoId;

            if (!isUploader && !isCreator) {
                res.status(403).json({
                    message: "Access denied: Cannot download proof file uploaded or created by another user",
                });
                return;
            }
        }

        // Use public URL since files are public-read
        const url = proofFile.url;

        const actorFieldMap: Record<UserRole, string> = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            user: "actorUserCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];

        await prisma.auditLog.create({
            data: {
                action: "DOWNLOAD_PROOF_FILE",
                entity: "ProofFile",
                entityId: proofFileId.toString(),
                meta: {
                    s3Key: proofFile.s3Key,
                    role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });

        res.status(200).json({ url });
    } catch (error) {
        console.error("Error downloading proof file:", {
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

export const getSignedProofFileUrl = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const proofFile = await prisma.proofFile.findUnique({
            where: { id: Number(id) },
        });

        if (!proofFile) {
            return res.status(404).json({ message: "File not found" });
        }

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET!,
            Key: proofFile.s3Key,
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        res.json({ downloadUrl: signedUrl });
    } catch (error) {
        console.error("Error generating signed URL:", error);
        res.status(500).json({ message: "Failed to generate download link" });
    }
};