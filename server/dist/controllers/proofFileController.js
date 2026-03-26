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
exports.getSignedProofFileUrl = exports.downloadProofFile = exports.getProofFileById = exports.deleteProofFile = exports.getProofFiles = exports.uploadProofFile = void 0;
const client_1 = require("@prisma/client");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3Client_1 = require("../middleware/s3Client");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const prisma = new client_1.PrismaClient();
const uploadProofFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const allowedRoles = ["admin", "accounts", "staff"];
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
        const expenseType = req.body.expenseType;
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
        const entityIds = [clientExpenseId, operationalExpenseId, quotationId].filter((id) => typeof id === "number");
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
            const expense = yield prisma.clientExpense.findUnique({
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
        }
        else if (operationalExpenseId !== undefined) {
            const expense = yield prisma.operationalExpense.findUnique({
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
        }
        else if (quotationId !== undefined) {
            const quotation = yield prisma.quotation.findUnique({
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
        const { key, url } = yield (0, s3Client_1.uploadToS3)(file.buffer, file.originalname, file.mimetype);
        const data = Object.assign(Object.assign(Object.assign({ expenseType: expenseType || undefined, clientExpense: clientExpenseId ? { connect: { id: clientExpenseId } } : undefined, operationalExpense: operationalExpenseId ? { connect: { id: operationalExpenseId } } : undefined, quotation: quotationId ? { connect: { id: quotationId } } : undefined, s3Key: key, url }, (role === "admin" && {
            uploadedByAdmin: { connect: { cognitoId } },
        })), (role === "accounts" && {
            uploadedByAccounts: { connect: { cognitoId } },
        })), (role === "staff" && {
            uploadedByStaff: { connect: { cognitoId } },
        }));
        const proofFile = yield prisma.proofFile.create({ data });
        // Audit log
        const actorFieldMap = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            staff: "actorStaffCognitoId",
            user: "actorUserCognitoId",
        };
        yield prisma.auditLog.create({
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
    }
    catch (error) {
        console.error("Error uploading proof file:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            body: req.body,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: "Internal server error" });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.uploadProofFile = uploadProofFile;
const getProofFiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const allowedRoles = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to access proof files` });
            return;
        }
        const { page = "1", limit = "10", expenseType, clientExpenseId, operationalExpenseId, quotationId, } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
            res.status(400).json({ message: "Invalid page or limit parameters" });
            return;
        }
        const where = {};
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
        const [proofFiles, total] = yield Promise.all([
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
    }
    catch (error) {
        console.error("Error fetching proof files:", {
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
exports.getProofFiles = getProofFiles;
const deleteProofFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const allowedRoles = ["admin", "accounts", "staff"];
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
        const proofFile = yield prisma.proofFile.findUnique({
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
            const isUploader = ((_a = proofFile.uploadedByStaff) === null || _a === void 0 ? void 0 : _a.cognitoId) === cognitoId;
            const isCreator = ((_b = proofFile.clientExpense) === null || _b === void 0 ? void 0 : _b.createdByStaffCognitoId) === cognitoId ||
                ((_c = proofFile.operationalExpense) === null || _c === void 0 ? void 0 : _c.createdByStaffCognitoId) === cognitoId ||
                ((_d = proofFile.quotation) === null || _d === void 0 ? void 0 : _d.createdByStaffCognitoId) === cognitoId;
            const isDraftOperational = ((_e = proofFile.operationalExpense) === null || _e === void 0 ? void 0 : _e.expenseStatus) === "DRAFT";
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
            yield s3Client_1.s3Client.send(new client_s3_1.DeleteObjectCommand(deleteParams));
        }
        catch (s3Error) {
            console.error("Error deleting file from S3:", {
                message: s3Error instanceof Error ? s3Error.message : "Unknown error",
                stack: s3Error instanceof Error ? s3Error.stack : undefined,
                timestamp: new Date().toISOString(),
            });
            res.status(500).json({ message: "Failed to delete file from storage" });
            return;
        }
        yield prisma.proofFile.delete({
            where: { id: proofFileId },
        });
        const actorFieldMap = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            user: "actorUserCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];
        yield prisma.auditLog.create({
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
    }
    catch (error) {
        console.error("Error deleting proof file:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            params: req.params,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: "Internal server error" });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.deleteProofFile = deleteProofFile;
const getProofFileById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const allowedRoles = ["admin", "accounts", "staff"];
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
        const proofFile = yield prisma.proofFile.findUnique({
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
            const isUploader = ((_a = proofFile.uploadedByStaff) === null || _a === void 0 ? void 0 : _a.cognitoId) === cognitoId;
            const isCreator = ((_b = proofFile.clientExpense) === null || _b === void 0 ? void 0 : _b.createdByStaffCognitoId) === cognitoId ||
                ((_c = proofFile.operationalExpense) === null || _c === void 0 ? void 0 : _c.createdByStaffCognitoId) === cognitoId ||
                ((_d = proofFile.quotation) === null || _d === void 0 ? void 0 : _d.createdByStaffCognitoId) === cognitoId;
            if (!isUploader && !isCreator) {
                res.status(403).json({
                    message: "Access denied: Cannot access proof file uploaded or created by another user",
                });
                return;
            }
        }
        res.status(200).json(proofFile);
    }
    catch (error) {
        console.error("Error fetching proof file:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            params: req.params,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: "Internal server error" });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.getProofFileById = getProofFileById;
const downloadProofFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const allowedRoles = ["admin", "accounts", "staff"];
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
        const proofFile = yield prisma.proofFile.findUnique({
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
            const isUploader = ((_a = proofFile.uploadedByStaff) === null || _a === void 0 ? void 0 : _a.cognitoId) === cognitoId;
            const isCreator = ((_b = proofFile.clientExpense) === null || _b === void 0 ? void 0 : _b.createdByStaffCognitoId) === cognitoId ||
                ((_c = proofFile.operationalExpense) === null || _c === void 0 ? void 0 : _c.createdByStaffCognitoId) === cognitoId ||
                ((_d = proofFile.quotation) === null || _d === void 0 ? void 0 : _d.createdByStaffCognitoId) === cognitoId;
            if (!isUploader && !isCreator) {
                res.status(403).json({
                    message: "Access denied: Cannot download proof file uploaded or created by another user",
                });
                return;
            }
        }
        // Use public URL since files are public-read
        const url = proofFile.url;
        const actorFieldMap = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            user: "actorUserCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];
        yield prisma.auditLog.create({
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
    }
    catch (error) {
        console.error("Error downloading proof file:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            params: req.params,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: "Internal server error" });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.downloadProofFile = downloadProofFile;
const getSignedProofFileUrl = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const proofFile = yield prisma.proofFile.findUnique({
            where: { id: Number(id) },
        });
        if (!proofFile) {
            return res.status(404).json({ message: "File not found" });
        }
        const command = new client_s3_1.GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: proofFile.s3Key,
        });
        const signedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client_1.s3Client, command, { expiresIn: 3600 });
        res.json({ downloadUrl: signedUrl });
    }
    catch (error) {
        console.error("Error generating signed URL:", error);
        res.status(500).json({ message: "Failed to generate download link" });
    }
});
exports.getSignedProofFileUrl = getSignedProofFileUrl;
