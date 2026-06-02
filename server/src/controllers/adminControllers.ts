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

        const existingAdmin = await prisma.admin.findUnique({ where: { cognitoId } });
        if (existingAdmin) {
            res.status(409).json({ message: "Admin already exists" });
            return;
        }

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

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No user data" });
            return;
        }

        if (req.user.role !== "admin") {
            res.status(403).json({ message: "Access denied: Admin only" });
            return;
        }

        // Fetch all three types
        const [admins, accounts, staff] = await Promise.all([
            prisma.admin.findMany({
                select: {
                    id: true,
                    cognitoId: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                    idNumber: true,
                    role: true,
                    department: true,
                    dateOfHire: true,
                    contractStartDate: true,
                    contractEndDate: true,
                    contractType: true,
                    contractPeriod: true,
                    dateOfBirth: true,
                    gender: true,
                    nationality: true,
                    profilePicture: true,
                    createdAt: true,
                }
            }),
            prisma.accounts.findMany({
                select: {
                    id: true,
                    cognitoId: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                    idNumber: true,
                    role: true,
                    department: true,
                    dateOfHire: true,
                    contractStartDate: true,
                    contractEndDate: true,
                    contractType: true,
                    contractPeriod: true,
                    dateOfBirth: true,
                    gender: true,
                    nationality: true,
                    profilePicture: true,
                    createdAt: true,
                }
            }),
            prisma.staff.findMany({
                select: {
                    id: true,
                    cognitoId: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                    idNumber: true,
                    role: true,
                    department: true,
                    dateOfHire: true,
                    contractStartDate: true,
                    contractEndDate: true,
                    contractType: true,
                    contractPeriod: true,
                    dateOfBirth: true,
                    gender: true,
                    nationality: true,
                    profilePicture: true,
                    createdAt: true,
                }
            })
        ]);

        const allUsers = [
            ...admins.map(u => ({ ...u, userType: "ADMIN" as const })),
            ...accounts.map(u => ({ ...u, userType: "ACCOUNTS" as const })),
            ...staff.map(u => ({ ...u, userType: "STAFF" as const })),
        ].sort((a, b) => a.name.localeCompare(b.name));

        res.json({
            success: true,
            count: allUsers.length,
            data: allUsers
        });

    } catch (error: any) {
        console.error("Error in getAllUsers:", error);
        res.status(500).json({
            message: `Error fetching all users: ${error.message}`
        });
    }
};