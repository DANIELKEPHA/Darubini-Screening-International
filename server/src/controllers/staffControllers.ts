import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { uploadToS3 } from "../middleware/s3Client";

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: { id: string; role: "admin" | "accounts" | "staff" };
}

// ====================== GET STAFF ======================
export const getStaff = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const staff = await prisma.staff.findUnique({
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

        if (staff) {
            res.json(staff);
        } else {
            res.status(404).json({ message: "Staff user not found" });
        }
    } catch (error: any) {
        res.status(500).json({ message: `Error retrieving staff user: ${error.message}` });
    }
};

// ====================== CREATE STAFF ======================
export const createStaff = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const cognitoId = req.user.role === "admin" && req.body.cognitoId
            ? req.body.cognitoId
            : req.user.id;

        if (!cognitoId) {
            res.status(400).json({ message: "Missing cognitoId" });
            return;
        }

        // Check if user already exists
        const existingStaff = await prisma.staff.findUnique({ where: { cognitoId } });
        if (existingStaff) {
            res.status(409).json({ message: "Staff user already exists" });
            return;
        }

        // ID Number uniqueness check
        if (idNumber) {
            const existingId = await prisma.staff.findUnique({ where: { idNumber } });
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

        const staff = await prisma.staff.create({
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

        res.status(201).json(staff);
    } catch (error: any) {
        if (error.code === "P2002") {
            res.status(409).json({ message: "Duplicate field (email or idNumber)" });
            return;
        }
        res.status(500).json({ message: `Error creating staff user: ${error.message}` });
    }
};

// ====================== UPDATE STAFF ======================
export const updateStaff = async (req: AuthRequest, res: Response): Promise<void> => {
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

        // ID Number uniqueness check (excluding current user)
        if (idNumber) {
            const existingId = await prisma.staff.findFirst({
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

        let profilePictureUrl: string | undefined = undefined;
        if (file) {
            const result = await uploadToS3(file.buffer, file.originalname, file.mimetype);
            profilePictureUrl = result.url;
        }

        const updatedStaff = await prisma.staff.update({
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
            message: "Staff user updated successfully",
            data: updatedStaff,
        });
    } catch (error: any) {
        if (error.code === "P2025") {
            res.status(404).json({ message: "Staff user not found" });
        } else {
            res.status(500).json({ message: `Error updating staff user: ${error.message}` });
        }
    }
};