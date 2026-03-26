// routes/stickyNoteRoutes.ts
import express from "express";
import {
    createStickyNote,
    getStickyNotes,
    getStickyNote,
    updateStickyNote,
    deleteStickyNote,
    shareStickyNote,
    revokeShare,
    getNoteShares,
} from "../controllers/stickyNotesController";

import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post(
    "/",
    authMiddleware(["admin", "accounts", "staff"]),
    createStickyNote
);

router.get(
    "/",
    authMiddleware(["admin", "accounts", "staff"]),
    getStickyNotes
);

router.get(
    "/:id",
    authMiddleware(["admin", "accounts", "staff"]),
    getStickyNote
);

router.patch(
    "/:id",
    authMiddleware(["admin", "accounts", "staff"]),
    updateStickyNote
);

router.delete(
    "/:id",
    authMiddleware(["admin", "accounts", "staff"]),
    deleteStickyNote
);

router.post(
    "/:id/share",
    authMiddleware(["admin", "accounts", "staff"]),
    shareStickyNote
);

router.delete(
    "/:id/share/:shareId",
    authMiddleware(["admin", "accounts", "staff"]),
    revokeShare
);

router.get(
    "/:id/shares",
    authMiddleware(["admin", "accounts", "staff"]),
    getNoteShares
);

export default router;