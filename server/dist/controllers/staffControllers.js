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
const prisma = new client_1.PrismaClient();
// Get Staff by cognitoId
const getStaff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cognitoId } = req.params;
        const staff = yield prisma.staff.findUnique({
            where: { cognitoId },
        });
        if (staff) {
            res.json(staff);
        }
        else {
            res.status(404).json({ message: "Staff user not found" });
        }
    }
    catch (error) {
        console.error("Error retrieving staff user:", error);
        res.status(500).json({ message: `Error retrieving staff user: ${error.message}` });
    }
});
exports.getStaff = getStaff;
// Create Staff
const createStaff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cognitoId, name, email, phoneNumber } = req.body;
        // Validate required fields
        if (!cognitoId || typeof cognitoId !== "string" || cognitoId.trim() === "") {
            res.status(400).json({ message: "Missing or invalid required field: cognitoId must be a non-empty string" });
            return;
        }
        if (!name || typeof name !== "string" || name.trim() === "") {
            res.status(400).json({ message: "Missing or invalid required field: name must be a non-empty string" });
            return;
        }
        if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            res.status(400).json({ message: "Missing or invalid required field: email must be a valid email address" });
            return;
        }
        if (!phoneNumber || typeof phoneNumber !== "string" || phoneNumber.trim() === "") {
            res.status(400).json({ message: "Missing or invalid required field: phoneNumber must be a non-empty string" });
            return;
        }
        // Create staff user in Prisma
        const staff = yield prisma.staff.create({
            data: {
                cognitoId,
                name,
                email,
                phoneNumber,
                role: "STAFF",
            },
        });
        res.status(201).json(staff);
    }
    catch (error) {
        console.error("Error creating staff user:", error);
        if (error.code === "P2002") {
            res.status(409).json({ message: `User with cognitoId ${req.body.cognitoId} already exists` });
            return;
        }
        res.status(500).json({ message: `Error creating staff user: ${error.message}` });
    }
});
exports.createStaff = createStaff;
// Update Staff
const updateStaff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cognitoId } = req.params;
        const { name, email, phoneNumber } = req.body;
        // Validate input
        if (name && (typeof name !== "string" || name.trim() === "")) {
            res.status(400).json({ message: "Invalid field: name must be a non-empty string" });
            return;
        }
        if (email && (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
            res.status(400).json({ message: "Invalid field: email must be a valid email address" });
            return;
        }
        if (phoneNumber && (typeof phoneNumber !== "string" || phoneNumber.trim() === "")) {
            res.status(400).json({ message: "Invalid field: phoneNumber must be a non-empty string" });
            return;
        }
        const updateStaff = yield prisma.staff.update({
            where: { cognitoId },
            data: {
                name,
                email,
                phoneNumber,
            },
        });
        res.json(updateStaff);
    }
    catch (error) {
        console.error("Error updating staff user:", error);
        if (error.code === "P2025") {
            res.status(404).json({ message: "Staff user not found" });
            return;
        }
        res.status(500).json({ message: `Error updating staff user: ${error.message}` });
    }
});
exports.updateStaff = updateStaff;
