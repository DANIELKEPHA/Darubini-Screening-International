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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteContact = exports.getContact = exports.getContacts = exports.createContact = void 0;
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library"); // Import the correct error type
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const validator_1 = __importDefault(require("validator"));
const prisma = new client_1.PrismaClient();
const createContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, message, subject, interests, privacyConsent, userCognitoId } = req.body;
        // Validate required fields
        if (!name || typeof name !== "string" || name.trim() === "" || name.length > 100) {
            res.status(400).json({ message: "Name must be a non-empty string, 100 characters or less" });
            return;
        }
        if (!email || !validator_1.default.isEmail(email) || email.length > 255) {
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
        // Validate userCognitoId
        if (userCognitoId) {
            const user = yield prisma.user.findUnique({
                where: { cognitoId: userCognitoId },
            });
            if (!user) {
                res.status(400).json({ message: `Invalid userCognitoId: no user found` });
                return;
            }
        }
        // Sanitize inputs
        const cleanName = (0, sanitize_html_1.default)(name);
        const cleanEmail = (0, sanitize_html_1.default)(email);
        const cleanMessage = message ? (0, sanitize_html_1.default)(message) : null;
        const cleanSubject = subject ? (0, sanitize_html_1.default)(subject) : null;
        const cleanInterests = (0, sanitize_html_1.default)(interests);
        const contact = yield prisma.contact.create({
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
        res.status(201).json(contact);
    }
    catch (error) { // Explicitly type as `any` to avoid TS18046
        if (error instanceof library_1.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                res.status(400).json({ message: "Unique constraint violation" });
                return;
            }
        }
        console.error("Error creating contact:", error, {
            payload: Object.assign(Object.assign({}, req.body), { email: "[REDACTED]", userCognitoId: "[REDACTED]" }),
        });
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.createContact = createContact;
const getContacts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const where = searchStr
            ? {
                OR: [
                    { name: { contains: searchStr, mode: "insensitive" } },
                    { email: { contains: searchStr, mode: "insensitive" } },
                    { message: { contains: searchStr, mode: "insensitive" } },
                    { subject: { contains: searchStr, mode: "insensitive" } },
                    { interests: { contains: searchStr, mode: "insensitive" } },
                ].filter((condition) => {
                    const [key, value] = Object.entries(condition)[0];
                    return value !== null && (key !== "message" && key !== "subject" && key !== "interests" ? true : value.contains !== "");
                }),
                deletedAt: null,
            }
            : { deletedAt: null };
        const [contacts, total] = yield Promise.all([
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
    }
    catch (error) {
        console.error("Error retrieving contacts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getContacts = getContacts;
const getContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const idNumber = Number(id);
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid contact ID" });
            return;
        }
        const contact = yield prisma.contact.findUnique({
            where: { id: idNumber, deletedAt: null },
            include: { user: true },
        });
        if (!contact) {
            res.status(404).json({ message: "Contact not found" });
            return;
        }
        res.json(contact);
    }
    catch (error) { // Explicitly type as `any` to avoid TS18046
        console.error("Error retrieving contact:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getContact = getContact;
const deleteContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const idNumber = Number(id);
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid contact ID" });
            return;
        }
        yield prisma.contact.update({
            where: { id: idNumber },
            data: { deletedAt: new Date() }, // Soft delete
        });
        const adminCognitoId = req.headers["x-user-cognito-id"];
        res.json({ message: "Contact submission deleted successfully" });
    }
    catch (error) { // Explicitly type as `any` to avoid TS18046
        if (error instanceof library_1.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "Contact submission not found" });
            return;
        }
        console.error("Error deleting contact:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.deleteContact = deleteContact;
