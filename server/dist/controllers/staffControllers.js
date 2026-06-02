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
exports.updateStaff = exports.createStaff = exports.getStaff = void 0;
const client_1 = require("@prisma/client");
const s3Client_1 = require("../middleware/s3Client");
const prisma = new client_1.PrismaClient();
const getStaff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const staff = yield prisma.staff.findUnique({
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
                supervisor: true,
                bio: true,
                dateOfHire: true,
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
        if (staff) {
            res.json(staff);
        }
        else {
            res.status(404).json({ message: "Staff user not found" });
        }
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving staff user: ${error.message}` });
    }
});
exports.getStaff = getStaff;
const createStaff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const existingStaff = yield prisma.staff.findUnique({ where: { cognitoId } });
        if (existingStaff) {
            res.status(409).json({ message: "Staff user already exists" });
            return;
        }
        if (idNumber) {
            const existingId = yield prisma.staff.findUnique({ where: { idNumber } });
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
        const staff = yield prisma.staff.create({
            data: {
                cognitoId,
                name,
                email,
                phoneNumber,
                idNumber,
                profilePicture: profilePictureUrl,
                role: "STAFF",
                supervisor,
                bio,
                dateOfHire: dateOfHire ? new Date(dateOfHire) : undefined,
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
        res.status(201).json(staff);
    }
    catch (error) {
        if (error.code === "P2002") {
            res.status(409).json({ message: "Duplicate field (email or idNumber)" });
            return;
        }
        res.status(500).json({ message: `Error creating staff user: ${error.message}` });
    }
});
exports.createStaff = createStaff;
const updateStaff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No user data" });
            return;
        }
        const { cognitoId } = req.params;
        const { name, email, phoneNumber, idNumber, supervisor, bio, dateOfHire, contractStartDate, contractEndDate, contractType, contractPeriod, department, dateOfBirth, gender, nationality, language, } = req.body;
        const file = req.file;
        if (cognitoId !== req.user.id && req.user.role !== "admin") {
            res.status(403).json({ message: "Access denied: You can only update your own profile" });
            return;
        }
        if (idNumber) {
            const existingId = yield prisma.staff.findFirst({
                where: {
                    idNumber,
                    NOT: { cognitoId },
                },
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
        }
        const updatedStaff = yield prisma.staff.update({
            where: { cognitoId },
            data: Object.assign({ name,
                email,
                phoneNumber,
                idNumber,
                supervisor,
                bio, dateOfHire: dateOfHire ? new Date(dateOfHire) : undefined, contractStartDate: contractStartDate ? new Date(contractStartDate) : undefined, contractEndDate: contractEndDate ? new Date(contractEndDate) : undefined, contractType,
                contractPeriod,
                department, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined, gender,
                nationality,
                language }, (profilePictureUrl && { profilePicture: profilePictureUrl })),
        });
        res.json({
            message: "Staff user updated successfully",
            data: updatedStaff,
        });
    }
    catch (error) {
        if (error.code === "P2025") {
            res.status(404).json({ message: "Staff user not found" });
        }
        else {
            res.status(500).json({ message: `Error updating staff user: ${error.message}` });
        }
    }
});
exports.updateStaff = updateStaff;
