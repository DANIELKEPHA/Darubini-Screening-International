import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { uploadToS3 } from "../middleware/s3Client";

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: { id: string; role: "admin" | "accounts" | "staff" };
}

// ====================== GET ACCOUNTS ======================
export const getAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const accounts = await prisma.accounts.findUnique({
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

        if (accounts) {
            res.json(accounts);
        } else {
            res.status(404).json({ message: "Accounts user not found" });
        }
    } catch (error: any) {
        res.status(500).json({ message: `Error retrieving accounts user: ${error.message}` });
    }
};

// ====================== CREATE ACCOUNTS ======================
export const createAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No user data" });
            return;
        }

        const {
            name,
            email,
            phoneNumber,
            idNumber,
            supervisor,
            bio,
            dateOfHire,
            contractStartDate,
            contractEndDate,
            contractType,
            contractPeriod,
            department,
            dateOfBirth,
            gender,
            nationality,
            language,
        } = req.body;

        const file = req.file;
        const cognitoId = req.user.role === "admin" && req.body.cognitoId ? req.body.cognitoId : req.user.id;

        if (!cognitoId) {
            res.status(400).json({ message: "Missing cognitoId" });
            return;
        }

        // Check if user already exists
        const existingAccounts = await prisma.accounts.findUnique({ where: { cognitoId } });
        if (existingAccounts) {
            res.status(409).json({ message: "Accounts user already exists" });
            return;
        }

        // ID Number uniqueness check
        if (idNumber) {
            const existingId = await prisma.accounts.findUnique({ where: { idNumber } });
            if (existingId) {
                res.status(409).json({ message: "ID Number already in use" });
                return;
            }
        }

        let profilePictureUrl: string | undefined = undefined;
        if (file) {
            const result = await uploadToS3(file.buffer, file.originalname, file.mimetype);
            profilePictureUrl = result.url;
        }

        const accounts = await prisma.accounts.create({
            data: {
                cognitoId,
                name,
                email,
                phoneNumber,
                idNumber,
                profilePicture: profilePictureUrl,
                role: "ACCOUNTS",

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

        res.status(201).json(accounts);
    } catch (error: any) {
        if (error.code === "P2002") {
            res.status(409).json({ message: "Duplicate field (email or idNumber)" });
            return;
        }
        res.status(500).json({ message: `Error creating accounts user: ${error.message}` });
    }
};

// ====================== UPDATE ACCOUNTS ======================
export const updateAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No user data" });
            return;
        }

        const { cognitoId } = req.params;

        const {
            name,
            email,
            phoneNumber,
            idNumber,
            supervisor,
            bio,
            dateOfHire,
            contractStartDate,
            contractEndDate,
            contractType,
            contractPeriod,
            department,
            dateOfBirth,
            gender,
            nationality,
            language,
        } = req.body;

        const file = req.file;

        // Authorization check
        if (cognitoId !== req.user.id && req.user.role !== "admin") {
            res.status(403).json({ message: "Access denied: You can only update your own profile" });
            return;
        }

        // ID Number uniqueness check
        if (idNumber) {
            const existingId = await prisma.accounts.findFirst({
                where: { idNumber, NOT: { cognitoId } },
            });
            if (existingId) {
                res.status(409).json({ message: "ID Number already in use by another user" });
                return;
            }
        }

        let profilePictureUrl: string | undefined = undefined;
        if (file) {
            const result = await uploadToS3(file.buffer, file.originalname, file.mimetype);
            profilePictureUrl = result.url;
        }

        const updatedAccounts = await prisma.accounts.update({
            where: { cognitoId },
            data: {
                name,
                email,
                phoneNumber,
                idNumber,
                supervisor,
                bio,
                dateOfHire: dateOfHire ? new Date(dateOfHire) : undefined,

                // === NEW CONTRACT FIELDS ===
                contractStartDate: contractStartDate ? new Date(contractStartDate) : undefined,
                contractEndDate: contractEndDate ? new Date(contractEndDate) : undefined,

                contractType,
                contractPeriod,
                department,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                gender,
                nationality,
                language,
                ...(profilePictureUrl && { profilePicture: profilePictureUrl }),
            },
        });

        res.json({
            message: "Accounts user updated successfully",
            data: updatedAccounts,
        });
    } catch (error: any) {
        if (error.code === "P2025") {
            res.status(404).json({ message: "Accounts user not found" });
        } else {
            res.status(500).json({ message: `Error updating accounts user: ${error.message}` });
        }
    }
};