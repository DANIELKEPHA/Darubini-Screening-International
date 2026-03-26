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
exports.updateUser = exports.createUser = exports.getUser = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cognitoId } = req.params;
        const user = yield prisma.user.findUnique({
            where: { cognitoId },
        });
        if (user) {
            res.json(user);
        }
        else {
            res.status(404).json({ message: "User not found" });
        }
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error retrieving user: ${error.message}` });
    }
});
exports.getUser = getUser;
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cognitoId, name, email, phoneNumber } = req.body;
        // Validate required fields
        if (cognitoId && (typeof cognitoId !== 'string' || cognitoId.trim() === '')) {
            res.status(400).json({ message: 'Invalid cognitoId: must be a non-empty string if provided' });
            return;
        }
        if (!name || typeof name !== 'string' || name.trim() === '') {
            res.status(400).json({ message: 'Missing or invalid required field: name must be a non-empty string' });
            return;
        }
        if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            res.status(400).json({ message: 'Missing or invalid required field: email must be a valid email address' });
            return;
        }
        // Create user
        const user = yield prisma.user.create({
            data: {
                cognitoId,
                name,
                email,
                phoneNumber: phoneNumber || null,
            },
        });
        res.status(201).json(user);
    }
    catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 'P2002') {
            // Unique constraint violation (e.g., duplicate cognitoId)
            res.status(409).json({ message: `User with cognitoId ${req.body.cognitoId} already exists` });
            return;
        }
        res.status(500).json({ message: `Error creating user: ${error.message}` });
    }
});
exports.createUser = createUser;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cognitoId } = req.params;
        const { name, email, phoneNumber } = req.body;
        const updateUser = yield prisma.user.update({
            where: { cognitoId },
            data: {
                name,
                email,
                phoneNumber,
            },
        });
        res.json(updateUser);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error updating user: ${error.message}` });
    }
});
exports.updateUser = updateUser;
