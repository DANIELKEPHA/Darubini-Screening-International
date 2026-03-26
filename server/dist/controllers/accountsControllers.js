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
exports.updateAccounts = exports.createAccounts = exports.getAccounts = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get Accounts by cognitoId
const getAccounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cognitoId } = req.params;
        const accounts = yield prisma.accounts.findUnique({
            where: { cognitoId },
        });
        if (accounts) {
            res.json(accounts);
        }
        else {
            res.status(404).json({ message: "Accounts user not found" });
        }
    }
    catch (error) {
        console.error("Error retrieving accounts user:", error);
        res.status(500).json({ message: `Error retrieving accounts user: ${error.message}` });
    }
});
exports.getAccounts = getAccounts;
// Create Accounts
const createAccounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        // Create accounts user in Prisma
        const accounts = yield prisma.accounts.create({
            data: {
                cognitoId,
                name,
                email,
                phoneNumber,
                role: "ACCOUNTS",
            },
        });
        res.status(201).json(accounts);
    }
    catch (error) {
        console.error("Error creating accounts user:", error);
        if (error.code === "P2002") {
            res.status(409).json({ message: `User with cognitoId ${req.body.cognitoId} already exists` });
            return;
        }
        res.status(500).json({ message: `Error creating accounts user: ${error.message}` });
    }
});
exports.createAccounts = createAccounts;
// Update Accounts
const updateAccounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const updateAccounts = yield prisma.accounts.update({
            where: { cognitoId },
            data: {
                name,
                email,
                phoneNumber,
            },
        });
        res.json(updateAccounts);
    }
    catch (error) {
        console.error("Error updating accounts user:", error);
        if (error.code === "P2025") {
            res.status(404).json({ message: "Accounts user not found" });
            return;
        }
        res.status(500).json({ message: `Error updating accounts user: ${error.message}` });
    }
});
exports.updateAccounts = updateAccounts;
