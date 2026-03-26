import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import AWS from "aws-sdk";

const prisma = new PrismaClient();

// Get Accounts by cognitoId
export const getAccounts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { cognitoId } = req.params;
        const accounts = await prisma.accounts.findUnique({
            where: { cognitoId },
        });

        if (accounts) {
            res.json(accounts);
        } else {
            res.status(404).json({ message: "Accounts user not found" });
        }
    } catch (error: any) {
        console.error("Error retrieving accounts user:", error);
        res.status(500).json({ message: `Error retrieving accounts user: ${error.message}` });
    }
};

// Create Accounts
export const createAccounts = async (req: Request, res: Response): Promise<void> => {
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
        const accounts = await prisma.accounts.create({
            data: {
                cognitoId,
                name,
                email,
                phoneNumber,
                role: "ACCOUNTS",
            },
        });

        res.status(201).json(accounts);
    } catch (error: any) {
        console.error("Error creating accounts user:", error);
        if (error.code === "P2002") {
            res.status(409).json({ message: `User with cognitoId ${req.body.cognitoId} already exists` });
            return;
        }
        res.status(500).json({ message: `Error creating accounts user: ${error.message}` });
    }
};

// Update Accounts
export const updateAccounts = async (req: Request, res: Response): Promise<void> => {
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

        const updateAccounts = await prisma.accounts.update({
            where: { cognitoId },
            data: {
                name,
                email,
                phoneNumber,
            },
        });

        res.json(updateAccounts);
    } catch (error: any) {
        console.error("Error updating accounts user:", error);
        if (error.code === "P2025") {
            res.status(404).json({ message: "Accounts user not found" });
            return;
        }
        res.status(500).json({ message: `Error updating accounts user: ${error.message}` });
    }
};