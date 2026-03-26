import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getPublicSignUpSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const setting = await prisma.appSettings.findUnique({
            where: { settingKey: "signupEnabled" },
        });

        const isSignUpEnabled = setting ? !!setting.value : false;

        res.set("Cache-Control", "no-cache");
        res.json({ isSignUpEnabled });
    } catch (error: any) {
        console.error("getPublicSignUpSettings error:", {
            errorMessage: error.message,
            errorStack: error.stack,
        });
        res.status(500).json({ message: `Failed to fetch sign-up setting: ${error.message}` });
    } finally {
        await prisma.$disconnect();
    }
};

export const getSignUpEnabled = async (req: Request, res: Response): Promise<void> => {
    try {
        const setting = await prisma.appSettings.findUnique({
            where: { settingKey: "signupEnabled" },
        });

        const isSignUpEnabled = setting ? !!setting.value : false;

        res.set("Cache-Control", "no-cache");
        res.json({ isSignUpEnabled });
    } catch (error: any) {
        console.error("getSignUpEnabled error:", {
            errorMessage: error.message,
            errorStack: error.stack,
        });
        res.status(500).json({ message: `Failed to fetch sign-up setting: ${error.message}` });
    } finally {
        await prisma.$disconnect();
    }
};

export const updateSignUpEnabled = async (req: Request, res: Response): Promise<void> => {
    try {
        const { isSignUpEnabled } = req.body;

        if (typeof isSignUpEnabled !== "boolean") {
            console.warn("Invalid input: isSignUpEnabled must be a boolean", { isSignUpEnabled });
            res.status(400).json({ message: "isSignUpEnabled must be a boolean" });
            return;
        }

        const adminCognitoId = (req as any).user?.id;

        if (!adminCognitoId) {
            console.warn("No admin Cognito ID found in request");
            res.status(401).json({ message: "Unauthorized: Admin credentials required" });
            return;
        }

        const admin = await prisma.admin.findUnique({
            where: { cognitoId: adminCognitoId },
        });

        if (!admin) {
            console.warn("Admin not found:", { adminCognitoId });
            res.status(403).json({ message: "Forbidden: Admin not found" });
            return;
        }

        const setting = await prisma.appSettings.upsert({
            where: { settingKey: "signupEnabled" },
            update: {
                value: isSignUpEnabled,
                updatedAt: new Date(),
            },
            create: {
                settingKey: "signupEnabled",
                value: isSignUpEnabled,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        await prisma.auditLog.create({
            data: {
                actorAdminCognitoId: adminCognitoId,
                action: "UPDATE_SIGNUP_ENABLED",
                entity: "AppSettings",
                entityId: setting.id.toString(),
                meta: { isSignUpEnabled },
                createdAt: new Date(),
            },
        });

        res.json({ isSignUpEnabled: setting.value });
    } catch (error: any) {
        console.error("updateSignUpEnabled error:", {
            errorMessage: error.message,
            errorStack: error.stack,
            requestBody: req.body,
        });
        res.status(500).json({ message: `Failed to update sign-up setting: ${error.message}` });
    } finally {
        await prisma.$disconnect();
    }
};