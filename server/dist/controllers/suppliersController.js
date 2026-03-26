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
exports.deleteSupplier = exports.updateSupplier = exports.createSupplier = exports.getSuppliers = void 0;
const client_1 = require("@prisma/client");
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const prisma = new client_1.PrismaClient();
const getSuppliers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        // Allow only admin and accounts roles to view suppliers
        const allowedRoles = ["admin", "accounts"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to view suppliers` });
            return;
        }
        const suppliers = yield prisma.supplier.findMany({
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
    }
    catch (error) {
        console.error("Error retrieving suppliers:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: "Internal server error" });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.getSuppliers = getSuppliers;
const createSupplier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, contactPerson, phone, address, kraPin } = req.body;
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        // Allow only admin and accounts roles to create suppliers
        const allowedRoles = ["admin", "accounts"];
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
        const supplier = yield prisma.supplier.create({
            data: {
                name: (0, sanitize_html_1.default)(name),
                email: email ? (0, sanitize_html_1.default)(email) : null,
                contactPerson: contactPerson ? (0, sanitize_html_1.default)(contactPerson) : null,
                phone: phone ? (0, sanitize_html_1.default)(phone) : null,
                address: address ? (0, sanitize_html_1.default)(address) : null,
                kraPin: kraPin ? (0, sanitize_html_1.default)(kraPin) : null,
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
        const actorFieldMap = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            user: "actorUserCognitoId", // Not used due to role restriction
            staff: "actorStaffCognitoId", // Not used due to role restriction
        };
        const actorField = actorFieldMap[role];
        yield prisma.auditLog.create({
            data: {
                action: "CREATE",
                entity: "Supplier",
                entityId: supplier.id.toString(),
                meta: { supplier },
                [actorField]: cognitoId,
            },
        });
        res.status(201).json(supplier);
    }
    catch (error) {
        console.error("Error creating supplier:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
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
exports.createSupplier = createSupplier;
const updateSupplier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, email, contactPerson, phone, address, kraPin } = req.body;
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        // Allow only admin and accounts roles to update suppliers
        const allowedRoles = ["admin", "accounts"];
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
        const supplier = yield prisma.supplier.update({
            where: { id: parseInt(id) },
            data: {
                name: name ? (0, sanitize_html_1.default)(name) : undefined,
                email: email ? (0, sanitize_html_1.default)(email) : null,
                contactPerson: contactPerson ? (0, sanitize_html_1.default)(contactPerson) : null,
                phone: phone ? (0, sanitize_html_1.default)(phone) : null,
                address: address ? (0, sanitize_html_1.default)(address) : null,
                kraPin: kraPin ? (0, sanitize_html_1.default)(kraPin) : null,
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
        const actorFieldMap = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            user: "actorUserCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];
        yield prisma.auditLog.create({
            data: {
                action: "UPDATE",
                entity: "Supplier",
                entityId: supplier.id.toString(),
                meta: { supplier },
                [actorField]: cognitoId,
            },
        });
        res.json(supplier);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "Supplier not found" });
            return;
        }
        console.error("Error updating supplier:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            body: req.body,
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
exports.updateSupplier = updateSupplier;
const deleteSupplier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        // Allow only admin and accounts roles to delete suppliers
        const allowedRoles = ["admin", "accounts"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to delete suppliers` });
            return;
        }
        const supplier = yield prisma.supplier.delete({
            where: { id: parseInt(id) },
            select: { id: true, name: true },
        });
        // Map role to audit log actor field
        const actorFieldMap = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            user: "actorUserCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];
        yield prisma.auditLog.create({
            data: {
                action: "DELETE",
                entity: "Supplier",
                entityId: supplier.id.toString(),
                meta: { supplier },
                [actorField]: cognitoId,
            },
        });
        res.json({ message: "Supplier deleted successfully", supplier });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "Supplier not found" });
            return;
        }
        console.error("Error deleting supplier:", {
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
exports.deleteSupplier = deleteSupplier;
