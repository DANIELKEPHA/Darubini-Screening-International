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
const s3Client_1 = require("../middleware/s3Client");
const prisma = new client_1.PrismaClient();
// ====================== GET ADMIN ======================
const getAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No user data" });
            return;
        }
        const { cognitoId } = req.params;
        if (cognitoId !== req.user.id && req.user.role !== "admin") {
            res.status(403).json({ message: "Access denied: You can only view your own profile" });
            return;
        }
        const admin = yield prisma.admin.findUnique({
            where: { cognitoId },
            select: {
                id: true,
                cognitoId: true,
                name: true,
                email: true,
                phoneNumber: true,
                idNumber: true,
                profilePicture: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                // Personal & Employment Fields
                supervisor: true,
                bio: true,
                dateOfHire: true,
                // === NEW CONTRACT FIELDS ===
                contractStartDate: true,
                contractEndDate: true,
                contractType: true,
                contractPeriod: true,
                department: true,
                dateOfBirth: true,
                gender: true,
                nationality: true,
                language: true,
            },
        });
        if (admin) {
            res.json(admin);
        }
        else {
            res.status(404).json({ message: "Admin not found" });
        }
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving admin: ${error.message}` });
    }
});
exports.getAdmin = getAdmin;
// ====================== CREATE ADMIN ======================
const createAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No user data" });
            return;
        }
        const { name, email, phoneNumber, idNumber, supervisor, bio, dateOfHire, contractStartDate, contractEndDate, contractType, contractPeriod, department, dateOfBirth, gender, nationality, language, } = req.body;
        const file = req.file;
        const cognitoId = req.user.role === "admin" && req.body.cognitoId
            ? req.body.cognitoId
            : req.user.id;
        if (!cognitoId) {
            res.status(400).json({ message: "Missing cognitoId" });
            return;
        }
        // Check existing admin
        const existingAdmin = yield prisma.admin.findUnique({ where: { cognitoId } });
        if (existingAdmin) {
            res.status(409).json({ message: "Admin already exists" });
            return;
        }
        // ID Number uniqueness
        if (idNumber) {
            const existingId = yield prisma.admin.findUnique({ where: { idNumber } });
            if (existingId) {
                res.status(409).json({ message: "ID Number already in use" });
                return;
            }
        }
        let profilePictureUrl = undefined;
        if (file) {
            const result = yield (0, s3Client_1.uploadToS3)(file.buffer, file.originalname, file.mimetype);
            profilePictureUrl = result.url;
        }
        const admin = yield prisma.admin.create({
            data: {
                cognitoId,
                name,
                email,
                phoneNumber,
                idNumber,
                profilePicture: profilePictureUrl,
                supervisor,
                bio,
                dateOfHire: dateOfHire ? new Date(dateOfHire) : undefined,
                // === NEW FIELDS ===
                contractStartDate: contractStartDate ? new Date(contractStartDate) : undefined,
                contractEndDate: contractEndDate ? new Date(contractEndDate) : undefined,
                contractType,
                contractPeriod,
                department,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                gender,
                nationality,
                language,
            },
        });
        res.status(201).json(admin);
    }
    catch (error) {
        res.status(500).json({ message: `Error creating admin: ${error.message}` });
    }
});
exports.createAdmin = createAdmin;
// ====================== UPDATE ADMIN ======================
const updateAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("File received:", !!req.file);
        console.log("Body:", req.body);
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No user data" });
            return;
        }
        const { cognitoId } = req.params;
        const { name, email, phoneNumber, idNumber, supervisor, bio, dateOfHire, contractStartDate, contractEndDate, contractType, contractPeriod, department, dateOfBirth, gender, nationality, language, } = req.body;
        const file = req.file;
        // Ownership check
        if (cognitoId !== req.user.id && req.user.role !== "admin") {
            res.status(403).json({ message: "Access denied: You can only update your own profile" });
            return;
        }
        // ID Number uniqueness check
        if (idNumber) {
            const existingId = yield prisma.admin.findFirst({
                where: { idNumber, NOT: { cognitoId } },
            });
            if (existingId) {
                res.status(409).json({ message: "ID Number already in use by another user" });
                return;
            }
        }
        let profilePictureUrl = undefined;
        if (file) {
            const result = yield (0, s3Client_1.uploadToS3)(file.buffer, file.originalname, file.mimetype);
            profilePictureUrl = result.url;
            console.log("Uploaded to S3:", profilePictureUrl);
        }
        const updatedAdmin = yield prisma.admin.update({
            where: { cognitoId },
            data: Object.assign({ name,
                email,
                phoneNumber,
                idNumber,
                supervisor,
                bio, dateOfHire: dateOfHire ? new Date(dateOfHire) : undefined, 
                // === NEW CONTRACT FIELDS ===
                contractStartDate: contractStartDate ? new Date(contractStartDate) : undefined, contractEndDate: contractEndDate ? new Date(contractEndDate) : undefined, contractType,
                contractPeriod,
                department, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined, gender,
                nationality,
                language }, (profilePictureUrl && { profilePicture: profilePictureUrl })),
        });
        res.json({
            message: "Admin updated successfully",
            data: updatedAdmin,
        });
    }
    catch (error) {
        if (error.code === "P2025") {
            res.status(404).json({ message: "Admin not found" });
        }
        else {
            res.status(500).json({ message: `Error updating admin: ${error.message}` });
        }
    }
});
exports.updateAdmin = updateAdmin;
