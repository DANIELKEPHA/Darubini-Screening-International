import { Request, Response } from "express";
import { PrismaClient, Prisma, StickySharePermission } from "@prisma/client";
import sanitizeHtml from "sanitize-html";

const prisma = new PrismaClient();

type UserRole = "admin" | "staff" | "accounts";
type StickyNoteRole = UserRole;

type StickyOwnerField = "adminCognitoId" | "staffCognitoId" | "accountsCognitoId";

const ROLE_OWNER_FIELD: Record<AuthUser["role"], StickyOwnerField> = {
    admin: "adminCognitoId",
    staff: "staffCognitoId",
    accounts: "accountsCognitoId",
};


interface AuthUser {
    id: string;
    role: UserRole;
}

const ROLE_FIELDS: Record<StickyNoteRole, keyof Prisma.StickyNoteCreateInput> = {
    admin: "admin",
    staff: "staff",
    accounts: "accounts",
} as const;

const AUDIT_ACTOR_FIELDS = {
    admin: "actorAdminCognitoId",
    accounts: "actorAccountsCognitoId",
    staff: "actorStaffCognitoId",
} as const;

const getAuditActorField = (role: UserRole): string => {
    const field = AUDIT_ACTOR_FIELDS[role];
    if (!field) throw new Error(`Invalid role for audit: ${role}`);
    return field;
};

const logAudit = async (
    action: "CREATE" | "READ" | "UPDATE" | "DELETE" | "BULK_CREATE",
    entity: string,
    entityId: string,
    meta: Record<string, any>,
    role: UserRole,
    cognitoId: string
) => {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                entity,
                entityId,
                meta,
                [getAuditActorField(role)]: cognitoId,
            } satisfies Prisma.AuditLogCreateInput,
        });
    } catch (error) {
        console.error("Audit log failed (non-critical):", error);
    }
};

export const createStickyNote = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        const { id: cognitoId, role } = req.user as AuthUser;

        const { title, content, color = "yellow", isPinned = false, width = 200, height = 200, posX = 50, posY = 50, reminderAt } =
            req.body as {
                title: string;
                content: string;
                color?: string;
                isPinned?: boolean;
                width?: number;
                height?: number;
                posX?: number;
                posY?: number;
                reminderAt?: string;
            };

        if (!title || !content) {
            return res.status(400).json({ message: "Title and content are required" });
        }

        const data: Prisma.StickyNoteCreateInput = {
            title: sanitizeHtml(title),
            content: sanitizeHtml(content),
            color,
            isPinned: Boolean(isPinned),
            width,
            height,
            posX,
            posY,
            ...(reminderAt ? { reminderAt: new Date(reminderAt) } : {}),
            [ROLE_FIELDS[role]]: { connect: { cognitoId } },
        };

        const note = await prisma.stickyNote.create({ data });

        await logAudit("CREATE", "StickyNote", note.id.toString(), { title }, role, cognitoId);

        res.status(201).json(note);
    } catch (error: any) {
        console.error("createStickyNote failed:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getStickyNotes = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        const { id: cognitoId, role } = req.user as AuthUser;

        const ownerField = `${ROLE_FIELDS[role]}CognitoId` as const;

        const notes = await prisma.stickyNote.findMany({
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

        await logAudit("READ", "StickyNote", "multiple", { count: notes.length }, role, cognitoId);

        res.json(notes);
    } catch (error) {
        console.error("getStickyNotes failed:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getStickyNote = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        const { id: cognitoId, role } = req.user as AuthUser;

        const noteId = Number(req.params.id);
        if (isNaN(noteId)) return res.status(400).json({ message: "Invalid note ID" });

        const ownerField = `${ROLE_FIELDS[role]}CognitoId` as const;

        const note = await prisma.stickyNote.findFirst({
            where: {
                id: noteId,
                OR: [
                    { [ownerField]: cognitoId },
                    { shares: { some: { [ownerField]: cognitoId } } },
                ],
            },
            include: { shares: true },
        });

        if (!note) return res.status(404).json({ message: "Note not found or access denied" });

        await logAudit("READ", "StickyNote", noteId.toString(), {}, role, cognitoId);

        res.json(note);
    } catch (error) {
        console.error("getStickyNote failed:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateStickyNote = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        const { id: cognitoId, role } = req.user as AuthUser;

        const noteId = Number(req.params.id);
        if (isNaN(noteId)) return res.status(400).json({ message: "Invalid note ID" });

        const ownerField: StickyOwnerField = ROLE_OWNER_FIELD[role];

        const note = await prisma.stickyNote.findFirst({
            where: { id: noteId },
            include: { shares: true },
        });

        if (!note) return res.status(404).json({ message: "Note not found" });

        const isOwner = note[ownerField] === cognitoId;
        const share = note.shares.find((s) => s[ownerField] === cognitoId);
        if (!isOwner && !share) {
            return res.status(403).json({ message: "You don't have access to this note" });
        }

        if (!isOwner && share?.permission === "VIEW") {
            return res.status(403).json({ message: "You only have view permission on this note" });
        }

        const {
            title,
            content,
            color,
            isPinned,
            isArchived,
            width,
            height,
            posX,
            posY,
            reminderAt,
        } = req.body as Partial<{
            title?: string;
            content?: string;
            color?: string;
            isPinned?: boolean;
            isArchived?: boolean;
            width?: number;
            height?: number;
            posX?: number;
            posY?: number;
            reminderAt?: string | null;
        }>;

        const updateData: Prisma.StickyNoteUpdateInput = {
            ...(title !== undefined && { title: sanitizeHtml(title) }),
            ...(content !== undefined && { content: sanitizeHtml(content) }),
            ...(color !== undefined && { color }),
            ...(isPinned !== undefined && { isPinned }),
            ...(isArchived !== undefined && { isArchived }),
            ...(width !== undefined && { width }),
            ...(height !== undefined && { height }),
            ...(posX !== undefined && { posX }),
            ...(posY !== undefined && { posY }),
            ...(reminderAt !== undefined && { reminderAt: reminderAt ? new Date(reminderAt) : null }),
        };

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No fields to update" });
        }

        const updated = await prisma.stickyNote.update({
            where: { id: noteId },
            data: updateData,
        });

        await logAudit("UPDATE", "StickyNote", noteId.toString(), { updatedFields: Object.keys(updateData) }, role, cognitoId);

        res.json(updated);
    } catch (error) {
        console.error("updateStickyNote failed:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteStickyNote = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        const { id: cognitoId, role } = req.user as AuthUser;

        const noteId = Number(req.params.id);
        if (isNaN(noteId)) return res.status(400).json({ message: "Invalid note ID" });

        const ownerField = `${ROLE_FIELDS[role]}CognitoId` as const;

        const note = await prisma.stickyNote.findFirst({
            where: { id: noteId, [ownerField]: cognitoId },
        });

        if (!note) return res.status(403).json({ message: "Only the owner can delete this note" });

        await prisma.stickyNote.delete({ where: { id: noteId } });

        await logAudit("DELETE", "StickyNote", noteId.toString(), {}, role, cognitoId);

        res.json({ message: "Sticky note deleted successfully" });
    } catch (error) {
        console.error("deleteStickyNote failed:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const shareStickyNote = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        const { id: cognitoId, role } = req.user as AuthUser;

        const noteId = Number(req.params.id);
        if (isNaN(noteId)) return res.status(400).json({ message: "Invalid note ID" });

        const { receiverCognitoId, receiverRole, permission = "VIEW" } = req.body as {
            receiverCognitoId: string;
            receiverRole: UserRole;
            permission?: "VIEW" | "EDIT";
        };

        if (!receiverCognitoId || !["admin", "staff", "accounts"].includes(receiverRole)) {
            return res.status(400).json({ message: "receiverCognitoId and valid receiverRole required" });
        }

        if (!["VIEW", "EDIT"].includes(permission)) {
            return res.status(400).json({ message: "Permission must be VIEW or EDIT" });
        }

        // Must be owner
        const ownerField = `${ROLE_FIELDS[role]}CognitoId` as const;
        const note = await prisma.stickyNote.findFirst({
            where: { id: noteId, [ownerField]: cognitoId },
        });

        if (!note) return res.status(403).json({ message: "Only the owner can share this note" });

        // Prevent self share
        if (receiverCognitoId === cognitoId) {
            return res.status(400).json({ message: "Cannot share with yourself" });
        }

        const receiverField = `${ROLE_FIELDS[receiverRole]}CognitoId` as const;

        // Check existing share
        const existing = await prisma.stickyNoteShare.findFirst({
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
            const updatedShare = await prisma.stickyNoteShare.update({
                where: { id: existing.id },
                data: { permission: permission as StickySharePermission },
            });

            await logAudit("UPDATE", "StickyNoteShare", existing.id.toString(), { permission }, role, cognitoId);

            return res.json({ success: true, message: "Permission updated", share: updatedShare });
        }

        // Create new share
        const share = await prisma.stickyNoteShare.create({
            data: {
                permission: permission as StickySharePermission,
                stickyNote: { connect: { id: noteId } },
                [ROLE_FIELDS[receiverRole]]: { connect: { cognitoId: receiverCognitoId } },
            },
        });

        await logAudit("CREATE", "StickyNoteShare", share.id.toString(), { receiverCognitoId, receiverRole, permission }, role, cognitoId);

        res.status(201).json({ success: true, share });
    } catch (error: any) {
        console.error("shareStickyNote failed:", error);
        res.status(500).json({ message: "Failed to share note" });
    }
};

export const revokeShare = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        const { id: cognitoId, role } = req.user as AuthUser;

        const noteId = Number(req.params.id);
        const shareId = Number(req.params.shareId);

        if (isNaN(noteId) || isNaN(shareId)) {
            return res.status(400).json({ message: "Invalid note ID or share ID" });
        }

        const ownerField = `${ROLE_FIELDS[role]}CognitoId` as const;

        // Must be owner
        const note = await prisma.stickyNote.findFirst({
            where: { id: noteId, [ownerField]: cognitoId },
        });

        if (!note) return res.status(403).json({ message: "Only the owner can revoke shares" });

        const deleted = await prisma.stickyNoteShare.deleteMany({
            where: {
                id: shareId,
                stickyNoteId: noteId,
            },
        });

        if (deleted.count === 0) {
            return res.status(404).json({ message: "Share entry not found" });
        }

        await logAudit("DELETE", "StickyNoteShare", shareId.toString(), { noteId }, role, cognitoId);

        res.json({ success: true, message: "Share revoked successfully" });
    } catch (error) {
        console.error("revokeShare failed:", error);
        res.status(500).json({ message: "Failed to revoke share" });
    }
};

export const getNoteShares = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        const { id: cognitoId, role } = req.user as AuthUser;

        const noteId = Number(req.params.id);
        if (isNaN(noteId)) return res.status(400).json({ message: "Invalid note ID" });

        const ownerField = `${ROLE_FIELDS[role]}CognitoId` as const;

        const note = await prisma.stickyNote.findFirst({
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

        if (!note) return res.status(403).json({ message: "Only the owner can view share list" });

        res.json(note.shares);
    } catch (error) {
        console.error("getNoteShares failed:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};