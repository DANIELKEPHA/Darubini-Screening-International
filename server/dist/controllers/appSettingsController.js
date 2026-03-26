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
exports.updateSignUpEnabled = exports.getSignUpEnabled = exports.getPublicSignUpSettings = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getPublicSignUpSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const setting = yield prisma.appSettings.findUnique({
            where: { settingKey: "signupEnabled" },
        });
        const isSignUpEnabled = setting ? !!setting.value : false;
        res.set("Cache-Control", "no-cache");
        res.json({ isSignUpEnabled });
    }
    catch (error) {
        console.error("getPublicSignUpSettings error:", {
            errorMessage: error.message,
            errorStack: error.stack,
        });
        res.status(500).json({ message: `Failed to fetch sign-up setting: ${error.message}` });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.getPublicSignUpSettings = getPublicSignUpSettings;
const getSignUpEnabled = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const setting = yield prisma.appSettings.findUnique({
            where: { settingKey: "signupEnabled" },
        });
        const isSignUpEnabled = setting ? !!setting.value : false;
        res.set("Cache-Control", "no-cache");
        res.json({ isSignUpEnabled });
    }
    catch (error) {
        console.error("getSignUpEnabled error:", {
            errorMessage: error.message,
            errorStack: error.stack,
        });
        res.status(500).json({ message: `Failed to fetch sign-up setting: ${error.message}` });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.getSignUpEnabled = getSignUpEnabled;
const updateSignUpEnabled = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { isSignUpEnabled } = req.body;
        if (typeof isSignUpEnabled !== "boolean") {
            console.warn("Invalid input: isSignUpEnabled must be a boolean", { isSignUpEnabled });
            res.status(400).json({ message: "isSignUpEnabled must be a boolean" });
            return;
        }
        const adminCognitoId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminCognitoId) {
            console.warn("No admin Cognito ID found in request");
            res.status(401).json({ message: "Unauthorized: Admin credentials required" });
            return;
        }
        const admin = yield prisma.admin.findUnique({
            where: { cognitoId: adminCognitoId },
        });
        if (!admin) {
            console.warn("Admin not found:", { adminCognitoId });
            res.status(403).json({ message: "Forbidden: Admin not found" });
            return;
        }
        const setting = yield prisma.appSettings.upsert({
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
        yield prisma.auditLog.create({
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
    }
    catch (error) {
        console.error("updateSignUpEnabled error:", {
            errorMessage: error.message,
            errorStack: error.stack,
            requestBody: req.body,
        });
        res.status(500).json({ message: `Failed to update sign-up setting: ${error.message}` });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.updateSignUpEnabled = updateSignUpEnabled;
