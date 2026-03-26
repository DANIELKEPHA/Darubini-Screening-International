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
exports.getNoteShares = exports.revokeShare = exports.shareStickyNote = exports.deleteStickyNote = exports.updateStickyNote = exports.getStickyNote = exports.getStickyNotes = exports.createStickyNote = void 0;
const client_1 = require("@prisma/client");
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const prisma = new client_1.PrismaClient();
const ROLE_OWNER_FIELD = {
    admin: "adminCognitoId",
    staff: "staffCognitoId",
    accounts: "accountsCognitoId",
};
const ROLE_FIELDS = {
    admin: "admin",
    staff: "staff",
    accounts: "accounts",
};
const AUDIT_ACTOR_FIELDS = {
    admin: "actorAdminCognitoId",
    accounts: "actorAccountsCognitoId",
    staff: "actorStaffCognitoId",
};
const getAuditActorField = (role) => {
    const field = AUDIT_ACTOR_FIELDS[role];
    if (!field)
        throw new Error(`Invalid role for audit: ${role}`);
    return field;
};
const logAudit = (action, entity, entityId, meta, role, cognitoId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.auditLog.create({
            data: {
                action,
                entity,
                entityId,
                meta,
                [getAuditActorField(role)]: cognitoId,
            },
        });
    }
    catch (error) {
        console.error("Audit log failed (non-critical):", error);
    }
});
const createStickyNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const { id: cognitoId, role } = req.user;
        const { title, content, color = "yellow", isPinned = false, width = 200, height = 200, posX = 50, posY = 50, reminderAt } = req.body;
        if (!title || !content) {
            return res.status(400).json({ message: "Title and content are required" });
        }
        const data = Object.assign(Object.assign({ title: (0, sanitize_html_1.default)(title), content: (0, sanitize_html_1.default)(content), color, isPinned: Boolean(isPinned), width,
            height,
            posX,
            posY }, (reminderAt ? { reminderAt: new Date(reminderAt) } : {})), { [ROLE_FIELDS[role]]: { connect: { cognitoId } } });
        const note = yield prisma.stickyNote.create({ data });
        yield logAudit("CREATE", "StickyNote", note.id.toString(), { title }, role, cognitoId);
        res.status(201).json(note);
    }
    catch (error) {
        console.error("createStickyNote failed:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.createStickyNote = createStickyNote;
const getStickyNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const { id: cognitoId, role } = req.user;
        const ownerField = `${ROLE_FIELDS[role]}CognitoId`;
        const notes = yield prisma.stickyNote.findMany({
            where: {
                OR: [
                    { [ownerField]: cognitoId }, // owned
                    {
                        shares: {
                            some: { [ownerField]: cognitoId }, // shared with me
                        },
                    },
                ],
            },
            include: {
                shares: {
                    select: {
                        id: true,
                        permission: true,
                        createdAt: true,
                        admin: { select: { cognitoId: true, name: true, email: true } },
                        staff: { select: { cognitoId: true, name: true, email: true } },
                        accounts: { select: { cognitoId: true, name: true, email: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        yield logAudit("READ", "StickyNote", "multiple", { count: notes.length }, role, cognitoId);
        res.json(notes);
    }
    catch (error) {
        console.error("getStickyNotes failed:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getStickyNotes = getStickyNotes;
const getStickyNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const { id: cognitoId, role } = req.user;
        const noteId = Number(req.params.id);
        if (isNaN(noteId))
            return res.status(400).json({ message: "Invalid note ID" });
        const ownerField = `${ROLE_FIELDS[role]}CognitoId`;
        const note = yield prisma.stickyNote.findFirst({
            where: {
                id: noteId,
                OR: [
                    { [ownerField]: cognitoId },
                    { shares: { some: { [ownerField]: cognitoId } } },
                ],
            },
            include: { shares: true },
        });
        if (!note)
            return res.status(404).json({ message: "Note not found or access denied" });
        yield logAudit("READ", "StickyNote", noteId.toString(), {}, role, cognitoId);
        res.json(note);
    }
    catch (error) {
        console.error("getStickyNote failed:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getStickyNote = getStickyNote;
const updateStickyNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const { id: cognitoId, role } = req.user;
        const noteId = Number(req.params.id);
        if (isNaN(noteId))
            return res.status(400).json({ message: "Invalid note ID" });
        const ownerField = ROLE_OWNER_FIELD[role];
        const note = yield prisma.stickyNote.findFirst({
            where: { id: noteId },
            include: { shares: true },
        });
        if (!note)
            return res.status(404).json({ message: "Note not found" });
        const isOwner = note[ownerField] === cognitoId;
        const share = note.shares.find((s) => s[ownerField] === cognitoId);
        if (!isOwner && !share) {
            return res.status(403).json({ message: "You don't have access to this note" });
        }
        if (!isOwner && (share === null || share === void 0 ? void 0 : share.permission) === "VIEW") {
            return res.status(403).json({ message: "You only have view permission on this note" });
        }
        const { title, content, color, isPinned, isArchived, width, height, posX, posY, reminderAt, } = req.body;
        const updateData = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (title !== undefined && { title: (0, sanitize_html_1.default)(title) })), (content !== undefined && { content: (0, sanitize_html_1.default)(content) })), (color !== undefined && { color })), (isPinned !== undefined && { isPinned })), (isArchived !== undefined && { isArchived })), (width !== undefined && { width })), (height !== undefined && { height })), (posX !== undefined && { posX })), (posY !== undefined && { posY })), (reminderAt !== undefined && { reminderAt: reminderAt ? new Date(reminderAt) : null }));
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No fields to update" });
        }
        const updated = yield prisma.stickyNote.update({
            where: { id: noteId },
            data: updateData,
        });
        yield logAudit("UPDATE", "StickyNote", noteId.toString(), { updatedFields: Object.keys(updateData) }, role, cognitoId);
        res.json(updated);
    }
    catch (error) {
        console.error("updateStickyNote failed:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateStickyNote = updateStickyNote;
const deleteStickyNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const { id: cognitoId, role } = req.user;
        const noteId = Number(req.params.id);
        if (isNaN(noteId))
            return res.status(400).json({ message: "Invalid note ID" });
        const ownerField = `${ROLE_FIELDS[role]}CognitoId`;
        const note = yield prisma.stickyNote.findFirst({
            where: { id: noteId, [ownerField]: cognitoId },
        });
        if (!note)
            return res.status(403).json({ message: "Only the owner can delete this note" });
        yield prisma.stickyNote.delete({ where: { id: noteId } });
        yield logAudit("DELETE", "StickyNote", noteId.toString(), {}, role, cognitoId);
        res.json({ message: "Sticky note deleted successfully" });
    }
    catch (error) {
        console.error("deleteStickyNote failed:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.deleteStickyNote = deleteStickyNote;
const shareStickyNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const { id: cognitoId, role } = req.user;
        const noteId = Number(req.params.id);
        if (isNaN(noteId))
            return res.status(400).json({ message: "Invalid note ID" });
        const { receiverCognitoId, receiverRole, permission = "VIEW" } = req.body;
        if (!receiverCognitoId || !["admin", "staff", "accounts"].includes(receiverRole)) {
            return res.status(400).json({ message: "receiverCognitoId and valid receiverRole required" });
        }
        if (!["VIEW", "EDIT"].includes(permission)) {
            return res.status(400).json({ message: "Permission must be VIEW or EDIT" });
        }
        // Must be owner
        const ownerField = `${ROLE_FIELDS[role]}CognitoId`;
        const note = yield prisma.stickyNote.findFirst({
            where: { id: noteId, [ownerField]: cognitoId },
        });
        if (!note)
            return res.status(403).json({ message: "Only the owner can share this note" });
        // Prevent self share
        if (receiverCognitoId === cognitoId) {
            return res.status(400).json({ message: "Cannot share with yourself" });
        }
        const receiverField = `${ROLE_FIELDS[receiverRole]}CognitoId`;
        // Check existing share
        const existing = yield prisma.stickyNoteShare.findFirst({
            where: {
                stickyNoteId: noteId,
                [receiverField]: receiverCognitoId,
            },
        });
        if (existing) {
            if (existing.permission === permission) {
                return res.status(409).json({ message: "Already shared with this user with same permission" });
            }
            // Update permission
            const updatedShare = yield prisma.stickyNoteShare.update({
                where: { id: existing.id },
                data: { permission: permission },
            });
            yield logAudit("UPDATE", "StickyNoteShare", existing.id.toString(), { permission }, role, cognitoId);
            return res.json({ success: true, message: "Permission updated", share: updatedShare });
        }
        // Create new share
        const share = yield prisma.stickyNoteShare.create({
            data: {
                permission: permission,
                stickyNote: { connect: { id: noteId } },
                [ROLE_FIELDS[receiverRole]]: { connect: { cognitoId: receiverCognitoId } },
            },
        });
        yield logAudit("CREATE", "StickyNoteShare", share.id.toString(), { receiverCognitoId, receiverRole, permission }, role, cognitoId);
        res.status(201).json({ success: true, share });
    }
    catch (error) {
        console.error("shareStickyNote failed:", error);
        res.status(500).json({ message: "Failed to share note" });
    }
});
exports.shareStickyNote = shareStickyNote;
const revokeShare = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const { id: cognitoId, role } = req.user;
        const noteId = Number(req.params.id);
        const shareId = Number(req.params.shareId);
        if (isNaN(noteId) || isNaN(shareId)) {
            return res.status(400).json({ message: "Invalid note ID or share ID" });
        }
        const ownerField = `${ROLE_FIELDS[role]}CognitoId`;
        // Must be owner
        const note = yield prisma.stickyNote.findFirst({
            where: { id: noteId, [ownerField]: cognitoId },
        });
        if (!note)
            return res.status(403).json({ message: "Only the owner can revoke shares" });
        const deleted = yield prisma.stickyNoteShare.deleteMany({
            where: {
                id: shareId,
                stickyNoteId: noteId,
            },
        });
        if (deleted.count === 0) {
            return res.status(404).json({ message: "Share entry not found" });
        }
        yield logAudit("DELETE", "StickyNoteShare", shareId.toString(), { noteId }, role, cognitoId);
        res.json({ success: true, message: "Share revoked successfully" });
    }
    catch (error) {
        console.error("revokeShare failed:", error);
        res.status(500).json({ message: "Failed to revoke share" });
    }
});
exports.revokeShare = revokeShare;
const getNoteShares = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const { id: cognitoId, role } = req.user;
        const noteId = Number(req.params.id);
        if (isNaN(noteId))
            return res.status(400).json({ message: "Invalid note ID" });
        const ownerField = `${ROLE_FIELDS[role]}CognitoId`;
        const note = yield prisma.stickyNote.findFirst({
            where: { id: noteId, [ownerField]: cognitoId },
            include: {
                shares: {
                    include: {
                        admin: { select: { cognitoId: true, name: true, email: true } },
                        staff: { select: { cognitoId: true, name: true, email: true } },
                        accounts: { select: { cognitoId: true, name: true, email: true } },
                    },
                },
            },
        });
        if (!note)
            return res.status(403).json({ message: "Only the owner can view share list" });
        res.json(note.shares);
    }
    catch (error) {
        console.error("getNoteShares failed:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getNoteShares = getNoteShares;
