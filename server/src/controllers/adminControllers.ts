import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Ensure Request includes user from authMiddleware
interface AuthRequest extends Request {
    user?: { id: string; role: "admin" | "user" | "accounts" | "staff" };
}

export const getAdmin = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
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

        const admin = await prisma.admin.findUnique({
            where: { cognitoId },
        });

        if (admin) {
            res.json(admin);
        } else {
            res.status(404).json({ message: "Admin not found" });
        }
    } catch (error: any) {
        res
            .status(500)
            .json({ message: `Error retrieving admin: ${error.message}` });
    }
};

export const createAdmin = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
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
        const existingAdmin = await prisma.admin.findUnique({ where: { cognitoId } });
        if (existingAdmin) {
            res.status(409).json({ message: "Admin already exists" });
            return;
        }

        const admin = await prisma.admin.create({
            data: {
                cognitoId,
                name,
                email,
                phoneNumber,
            },
        });

        res.status(201).json(admin);
    } catch (error: any) {
        res
            .status(500)
            .json({ message: `Error creating admin: ${error.message}` });
    }
};

export const updateAdmin = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
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

        const updateAdmin = await prisma.admin.update({
            where: { cognitoId },
            data: {
                name,
                email,
                phoneNumber,
            },
        });

        res.json(updateAdmin);
    } catch (error: any) {
        res
            .status(500)
            .json({ message: `Error updating admin: ${error.message}` });
    }
};