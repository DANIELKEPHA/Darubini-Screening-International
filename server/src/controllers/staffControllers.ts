import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get Staff by cognitoId
export const getStaff = async (req: Request, res: Response): Promise<void> => {
    try {
        const { cognitoId } = req.params;
        const staff = await prisma.staff.findUnique({
            where: { cognitoId },
        });

        if (staff) {
            res.json(staff);
        } else {
            res.status(404).json({ message: "Staff user not found" });
        }
    } catch (error: any) {
        console.error("Error retrieving staff user:", error);
        res.status(500).json({ message: `Error retrieving staff user: ${error.message}` });
    }
};

// Create Staff
export const createStaff = async (req: Request, res: Response): Promise<void> => {
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
        const staff = await prisma.staff.create({
            data: {
                cognitoId,
                name,
                email,
                phoneNumber,
                role: "STAFF",
            },
        });

        res.status(201).json(staff);
    } catch (error: any) {
        console.error("Error creating staff user:", error);
        if (error.code === "P2002") {
            res.status(409).json({ message: `User with cognitoId ${req.body.cognitoId} already exists` });
            return;
        }
        res.status(500).json({ message: `Error creating staff user: ${error.message}` });
    }
};

// Update Staff
export const updateStaff = async (req: Request, res: Response): Promise<void> => {
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

        const updateStaff = await prisma.staff.update({
            where: { cognitoId },
            data: {
                name,
                email,
                phoneNumber,
            },
        });

        res.json(updateStaff);
    } catch (error: any) {
        console.error("Error updating staff user:", error);
        if (error.code === "P2025") {
            res.status(404).json({ message: "Staff user not found" });
            return;
        }
        res.status(500).json({ message: `Error updating staff user: ${error.message}` });
    }
};