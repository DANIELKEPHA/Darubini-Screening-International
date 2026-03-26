"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const proofFileController_1 = require("../controllers/proofFileController");
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Only JPEG, PNG, WebP, or PDF files are allowed"));
        }
    },
});
const router = express_1.default.Router();
// Upload proof file (Accounts, Staff, or Admin)
router.post("/", (0, authMiddleware_1.authMiddleware)(["accounts", "staff", "admin"]), upload.single("file"), proofFileController_1.uploadProofFile);
// Get all proof files (Accounts, Staff, or Admin)
router.get("/", (0, authMiddleware_1.authMiddleware)(["accounts", "staff", "admin"]), proofFileController_1.getProofFiles);
// Get single proof file by ID (Accounts, Staff, or Admin)
router.get("/:id", (0, authMiddleware_1.authMiddleware)(["accounts", "staff", "admin"]), proofFileController_1.getProofFileById);
// Download proof file (Accounts, Staff, or Admin)
router.get("/:id/download", (0, authMiddleware_1.authMiddleware)(["accounts", "staff", "admin"]), proofFileController_1.downloadProofFile);
// Delete proof file (Accounts, Staff, or Admin)
router.delete("/:id", (0, authMiddleware_1.authMiddleware)(["accounts", "staff", "admin"]), proofFileController_1.deleteProofFile);
router.get("/:id/url", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), proofFileController_1.getSignedProofFileUrl);
exports.default = router;
