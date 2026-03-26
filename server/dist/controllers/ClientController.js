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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteClient = exports.updateClient = exports.getClient = exports.getClients = exports.createClient = exports.importClientsFromCSV = exports.logAudit = void 0;
const client_1 = require("@prisma/client");
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const s3Client_1 = require("../middleware/s3Client");
const stream_1 = require("stream");
const prisma = new client_1.PrismaClient();
const AUDIT_ACTOR_FIELDS = {
    admin: "actorAdminCognitoId",
    accounts: "actorAccountsCognitoId",
    staff: "actorStaffCognitoId",
};
const getAuditActorField = (role) => {
    const field = AUDIT_ACTOR_FIELDS[role];
    if (!field)
        throw new Error(`Invalid role for audit: ${role}`);
    return field;
};
const logAudit = (action, entity, entityId, meta, role, cognitoId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.auditLog.create({
            data: {
                action,
                entity,
                entityId,
                meta,
                [getAuditActorField(role)]: cognitoId,
            },
        });
    }
    catch (error) {
        console.error("Audit log failed (non-critical):", error);
    }
});
exports.logAudit = logAudit;
const importClientsFromCSV = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        if (!["admin", "accounts"].includes(role)) {
            res.status(403).json({ message: "Only admin and accounts can import clients" });
            return;
        }
        if (!req.file) {
            res.status(400).json({ message: "CSV file is required" });
            return;
        }
        const file = req.file;
        if (!file.mimetype.includes("csv") && !file.originalname.endsWith(".csv")) {
            res.status(400).json({ message: "File must be a CSV" });
            return;
        }
        const results = [];
        const errors = [];
        let rowIndex = 1; // CSV rows start at 1 (skip header)
        const stream = stream_1.Readable.from(file.buffer);
        yield new Promise((resolve, reject) => {
            stream
                .pipe((0, csv_parser_1.default)())
                .on("data", (data) => results.push(data))
                .on("error", reject)
                .on("end", resolve);
        });
        const createdClients = [];
        for (const row of results) {
            rowIndex++;
            try {
                const { clientName, customClientName, contactEmail, contactPhone, address, kraPin, isActive = "true", imageUrl: externalImageUrl, // optional: direct image URL in CSV
                 } = row;
                // === Validation (same as single create) ===
                if (!(clientName === null || clientName === void 0 ? void 0 : clientName.trim()) && !(customClientName === null || customClientName === void 0 ? void 0 : customClientName.trim())) {
                    errors.push({ row: rowIndex, error: "clientName or customClientName required" });
                    continue;
                }
                if (clientName && !Object.values(client_1.ClientName).includes(clientName.trim())) {
                    errors.push({ row: rowIndex, error: `Invalid clientName: ${clientName}` });
                    continue;
                }
                if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
                    errors.push({ row: rowIndex, error: `Invalid email: ${contactEmail}` });
                    continue;
                }
                let finalImageUrl = null;
                // Option 1: Upload image from external URL
                if (externalImageUrl === null || externalImageUrl === void 0 ? void 0 : externalImageUrl.trim()) {
                    try {
                        const response = yield fetch(externalImageUrl.trim());
                        if (!response.ok)
                            throw new Error("Failed to fetch image");
                        const buffer = Buffer.from(yield response.arrayBuffer());
                        const ext = ((_a = response.headers.get("content-type")) === null || _a === void 0 ? void 0 : _a.split("/")[1]) || "png";
                        const filename = `csv-import-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                        const { url } = yield (0, s3Client_1.uploadToS3)(buffer, filename, response.headers.get("content-type") || "image/png");
                        finalImageUrl = url;
                    }
                    catch (imgErr) {
                        errors.push({ row: rowIndex, error: `Failed to download image: ${externalImageUrl}` });
                    }
                }
                // === Create Client ===
                const client = yield prisma.clientList.create({
                    data: {
                        clientName: clientName === null || clientName === void 0 ? void 0 : clientName.trim(),
                        customClientName: customClientName ? (0, sanitize_html_1.default)(customClientName.trim()) : null,
                        contactEmail: contactEmail ? (0, sanitize_html_1.default)(contactEmail.trim()) : null,
                        contactPhone: contactPhone ? (0, sanitize_html_1.default)(contactPhone.trim()) : null,
                        address: address ? (0, sanitize_html_1.default)(address.trim()) : null,
                        kraPin: kraPin ? (0, sanitize_html_1.default)(kraPin.trim()) : null,
                        isActive: ((isActive === null || isActive === void 0 ? void 0 : isActive.toString().toLowerCase()) === "true" || isActive === "1"),
                        imageUrl: finalImageUrl,
                        [role === "admin" ? "createdByAdmin" : "createdByAccounts"]: {
                            connect: { cognitoId },
                        },
                    },
                    select: { id: true, customClientName: true, clientName: true },
                });
                createdClients.push(client);
            }
            catch (err) {
                errors.push({ row: rowIndex, error: err.message || "Unknown error" });
            }
        }
        // === Audit Bulk Import ===
        yield (0, exports.logAudit)("BULK_CREATE", "ClientList", "csv-import", {
            totalRows: results.length,
            successful: createdClients.length,
            failed: errors.length,
            fileName: file.originalname,
        }, role, cognitoId);
        res.status(200).json({
            message: "CSV import completed",
            successful: createdClients.length,
            failed: errors.length,
            created: createdClients.map(c => ({ id: c.id, name: c.customClientName || c.clientName })),
            errors,
        });
    }
    catch (error) {
        console.error("CSV import failed:", error);
        res.status(500).json({ message: "CSV import failed", error: error.message });
    }
});
exports.importClientsFromCSV = importClientsFromCSV;
const createClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // === Auth ===
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        if (!["admin", "accounts", "staff"].includes(role)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }
        // === Image Upload ===
        let imageUrl = null;
        if (req.file) {
            const file = req.file;
            const { url } = yield (0, s3Client_1.uploadToS3)(file.buffer, file.originalname, file.mimetype);
            imageUrl = url;
        }
        // === Form Data ===
        const { clientName, customClientName, contactEmail, contactPhone, address, kraPin, isActive = "true", } = req.body;
        // === Validation ===
        if (!clientName && !customClientName) {
            res.status(400).json({ message: "clientName or customClientName is required" });
            return;
        }
        if (clientName && !Object.values(client_1.ClientName).includes(clientName)) {
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
        const data = {
            clientName: clientName,
            customClientName: customClientName ? (0, sanitize_html_1.default)(customClientName) : null,
            contactEmail: contactEmail ? (0, sanitize_html_1.default)(contactEmail) : null,
            contactPhone: contactPhone ? (0, sanitize_html_1.default)(contactPhone) : null,
            address: address ? (0, sanitize_html_1.default)(address) : null,
            kraPin: kraPin ? (0, sanitize_html_1.default)(kraPin) : null,
            isActive: isActive === "true",
            imageUrl,
            [role === "admin" ? "createdByAdmin" : role === "accounts" ? "createdByAccounts" : "createdByStaff"]: {
                connect: { cognitoId },
            },
        };
        const client = yield prisma.clientList.create({
            data,
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
            },
        });
        // === Audit & Response ===
        yield (0, exports.logAudit)("CREATE", "ClientList", client.id.toString(), {
            clientName: client.customClientName || client.clientName || "Unnamed",
            hasImage: !!imageUrl,
        }, role, cognitoId);
        res.status(201).json(client);
    }
    catch (error) {
        console.error("createClient failed:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
exports.createClient = createClient;
const getClients = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        if (!["admin", "accounts", "staff"].includes(role)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 10);
        const [clients, total] = yield Promise.all([
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
        (0, exports.logAudit)("READ", "ClientList", "multiple", { count: clients.length, page, limit }, role, cognitoId);
        res.json({
            clients,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        });
    }
    catch (error) {
        console.error("Error retrieving clients:", error);
        if (!res.headersSent)
            res.status(500).json({ message: "Internal server error" });
    }
});
exports.getClients = getClients;
const getClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // === Authentication & Authorization ===
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        if (!["admin", "accounts", "staff"].includes(role)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }
        const idNumber = Number(req.params.id);
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid client ID" });
            return;
        }
        const client = yield prisma.clientList.findUnique({
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
        yield (0, exports.logAudit)("READ", "ClientList", idNumber.toString(), {
            clientId: idNumber,
            clientName: client.customClientName || client.clientName || "Unknown",
            hasImage: !!client.imageUrl,
        }, role, cognitoId);
        // === Success ===
        res.json(client);
    }
    catch (error) {
        console.error("getClient failed:", {
            error: error.message,
            clientId: req.params.id,
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
        });
        if (!res.headersSent) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
exports.getClient = getClient;
const updateClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        if (!["admin", "accounts", "staff"].includes(role)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }
        const idNumber = Number(req.params.id);
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid client ID" });
            return;
        }
        const existing = yield prisma.clientList.findUnique({
            where: { id: idNumber, deletedAt: null },
            select: { id: true, imageUrl: true },
        });
        if (!existing) {
            res.status(404).json({ message: "Client not found" });
            return;
        }
        let imageUrl = existing.imageUrl;
        if (req.file) {
            const file = req.file;
            const { url } = yield (0, s3Client_1.uploadToS3)(file.buffer, file.originalname, file.mimetype);
            imageUrl = url;
        }
        const { clientName, contactEmail, contactPhone, address, kraPin, isActive, } = req.body;
        if (clientName && !Object.values(client_1.ClientName).includes(clientName)) {
            res.status(400).json({ message: "Invalid client name" });
            return;
        }
        if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
            res.status(400).json({ message: "Invalid email" });
            return;
        }
        const data = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (clientName && { clientName: clientName })), (contactEmail !== undefined && { contactEmail: contactEmail ? (0, sanitize_html_1.default)(contactEmail) : null })), (contactPhone !== undefined && { contactPhone: contactPhone ? (0, sanitize_html_1.default)(contactPhone) : null })), (address !== undefined && { address: address ? (0, sanitize_html_1.default)(address) : null })), (kraPin !== undefined && { kraPin: kraPin ? (0, sanitize_html_1.default)(kraPin) : null })), (isActive !== undefined && { isActive: isActive === "true" })), (imageUrl !== existing.imageUrl && { imageUrl }));
        const updatedClient = yield prisma.clientList.update({
            where: { id: idNumber },
            data,
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
            },
        });
        yield (0, exports.logAudit)("UPDATE", "ClientList", idNumber.toString(), {
            updatedFields: Object.keys(data),
            clientName: updatedClient.customClientName || updatedClient.clientName,
            hasImageUpdated: imageUrl !== existing.imageUrl,
        }, role, cognitoId);
        res.json(updatedClient);
    }
    catch (error) {
        console.error("Error updating client:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateClient = updateClient;
const deleteClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        if (!["admin", "accounts", "staff"].includes(role)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }
        const idNumber = Number(req.params.id);
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid client ID" });
            return;
        }
        const client = yield prisma.clientList.findUnique({
            where: { id: idNumber, deletedAt: null },
        });
        if (!client) {
            res.status(404).json({ message: "Client not found" });
            return;
        }
        const updatedClient = yield prisma.clientList.update({
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
        yield (0, exports.logAudit)("DELETE", "ClientList", idNumber.toString(), {
            clientName: client.customClientName || client.clientName,
        }, role, cognitoId);
        // Success response
        res.json({
            message: "Client soft-deleted successfully",
            client: updatedClient,
        });
    }
    catch (error) {
        console.error("Error deleting client:", error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "Client not found" });
        }
        else {
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
exports.deleteClient = deleteClient;
