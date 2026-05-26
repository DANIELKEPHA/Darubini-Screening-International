import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { uploadToS3 } from "../middleware/s3Client";

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: { id: string; role: "admin" | "accounts" | "staff" };
}

export const getAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const admin = await prisma.admin.findUnique({
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

                // === NEW FIELDS ===
                supervisor: true,
                bio: true,
                dateOfHire: true,
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
        } else {
            res.status(404).json({ message: "Admin not found" });
        }
    } catch (error: any) {
        res.status(500).json({ message: `Error retrieving admin: ${error.message}` });
    }
};

export const createAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
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
            contractType,
            contractPeriod,
            department,
            dateOfBirth,
            gender,
            nationality,
            language,
        } = req.body;

        const file = req.file;

        const cognitoId = req.user.role === "admin" && req.body.cognitoId
            ? req.body.cognitoId
            : req.user.id;

        if (!cognitoId) {
            res.status(400).json({ message: "Missing cognitoId" });
            return;
        }

        // Check existing admin
        const existingAdmin = await prisma.admin.findUnique({ where: { cognitoId } });
        if (existingAdmin) {
            res.status(409).json({ message: "Admin already exists" });
            return;
        }

        // ID Number uniqueness
        if (idNumber) {
            const existingId = await prisma.admin.findUnique({ where: { idNumber } });
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

        const admin = await prisma.admin.create({
            data: {
                cognitoId,
                name,
                email,
                phoneNumber,
                idNumber,
                profilePicture: profilePictureUrl,

                // New Fields
                supervisor,
                bio,
                dateOfHire: dateOfHire ? new Date(dateOfHire) : undefined,
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
    } catch (error: any) {
        res.status(500).json({ message: `Error creating admin: ${error.message}` });
    }
};

export const updateAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        console.log("File received:", !!req.file);
        console.log("Body:", req.body);

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
            contractType,
            contractPeriod,
            department,
            dateOfBirth,
            gender,
            nationality,
            language,
        } = req.body;

        const file = req.file;

        // Ownership check
        if (cognitoId !== req.user.id && req.user.role !== "admin") {
            res.status(403).json({ message: "Access denied: You can only update your own profile" });
            return;
        }

        // ID Number uniqueness check
        if (idNumber) {
            const existingId = await prisma.admin.findFirst({
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
            console.log("Uploaded to S3:", profilePictureUrl);
        }

        const updatedAdmin = await prisma.admin.update({
            where: { cognitoId },
            data: {
                name,
                email,
                phoneNumber,
                idNumber,
                supervisor,
                bio,
                dateOfHire: dateOfHire ? new Date(dateOfHire) : undefined,
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
            message: "Admin updated successfully",
            data: updatedAdmin,
        });
    } catch (error: any) {
        if (error.code === "P2025") {
            res.status(404).json({ message: "Admin not found" });
        } else {
            res.status(500).json({ message: `Error updating admin: ${error.message}` });
        }
    }
};