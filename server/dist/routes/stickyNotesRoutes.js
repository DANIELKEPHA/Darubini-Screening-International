"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/stickyNoteRoutes.ts
const express_1 = __importDefault(require("express"));
const stickyNotesController_1 = require("../controllers/stickyNotesController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post("/", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), stickyNotesController_1.createStickyNote);
router.get("/", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), stickyNotesController_1.getStickyNotes);
router.get("/:id", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), stickyNotesController_1.getStickyNote);
router.patch("/:id", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), stickyNotesController_1.updateStickyNote);
router.delete("/:id", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), stickyNotesController_1.deleteStickyNote);
router.post("/:id/share", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), stickyNotesController_1.shareStickyNote);
router.delete("/:id/share/:shareId", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), stickyNotesController_1.revokeShare);
router.get("/:id/shares", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), stickyNotesController_1.getNoteShares);
exports.default = router;
