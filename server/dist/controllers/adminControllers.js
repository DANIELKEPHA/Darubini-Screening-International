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
exports.updateAdmin = exports.createAdmin = exports.getAdmin = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No user data" });
            return;
        }
        const { cognitoId } = req.params;
        // Ownership check: Allow only if cognitoId matches req.user.id or user is super-admin
        if (cognitoId !== req.user.id && req.user.role !== "admin") {
            res.status(403).json({ message: "Access denied: You can only view your own profile" });
            return;
        }
        const admin = yield prisma.admin.findUnique({
            where: { cognitoId },
        });
        if (admin) {
            res.json(admin);
        }
        else {
            res.status(404).json({ message: "Admin not found" });
        }
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error retrieving admin: ${error.message}` });
    }
});
exports.getAdmin = getAdmin;
const createAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No user data" });
            return;
        }
        const { name, email, phoneNumber } = req.body;
        // Use req.user.id for cognitoId unless super-admin
        const cognitoId = req.user.role === "admin" ? req.body.cognitoId : req.user.id;
        if (!cognitoId) {
            res.status(400).json({ message: "Missing cognitoId for admin creation" });
            return;
        }
        // Check if admin already exists
        const existingAdmin = yield prisma.admin.findUnique({ where: { cognitoId } });
        if (existingAdmin) {
            res.status(409).json({ message: "Admin already exists" });
            return;
        }
        const admin = yield prisma.admin.create({
            data: {
                cognitoId,
                name,
                email,
                phoneNumber,
            },
        });
        res.status(201).json(admin);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error creating admin: ${error.message}` });
    }
});
exports.createAdmin = createAdmin;
const updateAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No user data" });
            return;
        }
        const { cognitoId } = req.params;
        const { name, email, phoneNumber } = req.body;
        // Ownership check: Allow only if cognitoId matches req.user.id or user is super-admin
        if (cognitoId !== req.user.id && req.user.role !== "admin") {
            res.status(403).json({ message: "Access denied: You can only update your own profile" });
            return;
        }
        const updateAdmin = yield prisma.admin.update({
            where: { cognitoId },
            data: {
                name,
                email,
                phoneNumber,
            },
        });
        res.json(updateAdmin);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error updating admin: ${error.message}` });
    }
});
exports.updateAdmin = updateAdmin;
