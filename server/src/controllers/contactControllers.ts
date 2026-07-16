import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import sanitizeHtml from "sanitize-html";
import validator from "validator";

const prisma = new PrismaClient();

let socketEmitter: {
    emitNewContact: (contact: any) => void;
    emitContactDeleted: (contactId: number, deletedBy?: string) => void; // Added optional second parameter
    emitContactUpdated: (contact: any) => void;
} | null = null;

export const setSocketEmitter = (emitter: typeof socketEmitter) => {
    socketEmitter = emitter;
};

export const createContact = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, message, subject, interests, privacyConsent, userCognitoId } = req.body;

        if (!name || typeof name !== "string" || name.trim() === "" || name.length > 100) {
            res.status(400).json({ message: "Name must be a non-empty string, 100 characters or less" });
            return;
        }
        if (!email || !validator.isEmail(email) || email.length > 255) {
            res.status(400).json({ message: "Email must be a valid email address, 255 characters or less" });
            return;
        }
        if (!interests || typeof interests !== "string" || interests.trim() === "" || interests.length > 500) {
            res.status(400).json({ message: "Interests must be a non-empty string, 500 characters or less" });
            return;
        }
        if (privacyConsent === undefined || typeof privacyConsent !== "boolean") {
            res.status(400).json({ message: "PrivacyConsent must be a boolean" });
            return;
        }
        if (message && message.length > 1000) {
            res.status(400).json({ message: "Message must be 1000 characters or less" });
            return;
        }
        if (subject && subject.length > 200) {
            res.status(400).json({ message: "Subject must be 200 characters or less" });
            return;
        }

        if (userCognitoId) {
            const user = await prisma.user.findUnique({
                where: { cognitoId: userCognitoId },
            });
            if (!user) {
                res.status(400).json({ message: `Invalid userCognitoId: no user found` });
                return;
            }
        }

        const cleanName = sanitizeHtml(name);
        const cleanEmail = sanitizeHtml(email);
        const cleanMessage = message ? sanitizeHtml(message) : null;
        const cleanSubject = subject ? sanitizeHtml(subject) : null;
        const cleanInterests = sanitizeHtml(interests);

        const contact = await prisma.contact.create({
            data: {
                name: cleanName,
                email: cleanEmail,
                message: cleanMessage,
                subject: cleanSubject,
                interests: cleanInterests,
                privacyConsent,
                userCognitoId: userCognitoId || null,
            },
        });

        if (socketEmitter) {
            socketEmitter.emitNewContact(contact);
        }

        res.status(201).json(contact);
    } catch (error: any) {
        if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                res.status(400).json({ message: "Unique constraint violation" });
                return;
            }
        }
        console.error("Error creating contact:", error, {
            payload: { ...req.body, email: "[REDACTED]", userCognitoId: "[REDACTED]" },
        });
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getContacts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { page = "1", limit = "10", search } = req.query;
        const pageNumber = Number(page);
        const maxLimit = 100;
        const limitNumber = Math.min(Number(limit), maxLimit);

        if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
            res.status(400).json({ message: "Invalid page or limit parameters" });
            return;
        }

        const searchStr = search ? String(search).trim() : "";
        const where: Prisma.ContactWhereInput = searchStr
            ? {
                OR: [
                    { name: { contains: searchStr, mode: "insensitive" as const } },
                    { email: { contains: searchStr, mode: "insensitive" as const } },
                    { message: { contains: searchStr, mode: "insensitive" as const } },
                    { subject: { contains: searchStr, mode: "insensitive" as const } },
                    { interests: { contains: searchStr, mode: "insensitive" as const } },
                ].filter((condition) => {
                    const [key, value] = Object.entries(condition)[0];
                    return value !== null && (key !== "message" && key !== "subject" && key !== "interests" ? true : value.contains !== "");
                }),
                deletedAt: null,
            }
            : { deletedAt: null };

        const [contacts, total] = await Promise.all([
            prisma.contact.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (pageNumber - 1) * limitNumber,
                take: limitNumber,
                include: { user: true },
            }),
            prisma.contact.count({ where }),
        ]);

        if (contacts.length === 0) {
            res.status(404).json({ message: "No contact submissions found" });
            return;
        }

        res.json({
            contacts,
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        });
    } catch (error: any) {
        console.error("Error retrieving contacts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getContact = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const idNumber = Number(id);

        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid contact ID" });
            return;
        }

        const contact = await prisma.contact.findUnique({
            where: { id: idNumber, deletedAt: null },
            include: { user: true },
        });

        if (!contact) {
            res.status(404).json({ message: "Contact not found" });
            return;
        }

        res.json(contact);
    } catch (error: any) {
        console.error("Error retrieving contact:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



export const deleteContact = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const idNumber = Number(id);

        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid contact ID" });
            return;
        }

        await prisma.contact.update({
            where: { id: idNumber },
            data: { deletedAt: new Date() },
        });

        const adminCognitoId = req.headers["x-user-cognito-id"] as string;

        // Emit WebSocket event
        if (socketEmitter) {
            socketEmitter.emitContactDeleted(idNumber, adminCognitoId);
        }

        res.json({ message: "Contact submission deleted successfully" });
    } catch (error: any) {
        if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "Contact submission not found" });
            return;
        }
        console.error("Error deleting contact:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};