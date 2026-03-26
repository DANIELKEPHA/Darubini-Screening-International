import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { uploadProofFile, getProofFiles, deleteProofFile, getProofFileById, getSignedProofFileUrl, downloadProofFile } from "../controllers/proofFileController";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPEG, PNG, WebP, or PDF files are allowed"));
        }
    },
});

const router = express.Router();

// Upload proof file (Accounts, Staff, or Admin)
router.post("/", authMiddleware(["accounts", "staff", "admin"]), upload.single("file"), uploadProofFile);

// Get all proof files (Accounts, Staff, or Admin)
router.get("/", authMiddleware(["accounts", "staff", "admin"]), getProofFiles);

// Get single proof file by ID (Accounts, Staff, or Admin)
router.get("/:id", authMiddleware(["accounts", "staff", "admin"]), getProofFileById);

// Download proof file (Accounts, Staff, or Admin)
router.get("/:id/download", authMiddleware(["accounts", "staff", "admin"]), downloadProofFile);

// Delete proof file (Accounts, Staff, or Admin)
router.delete("/:id", authMiddleware(["accounts", "staff", "admin"]), deleteProofFile);

router.get("/:id/url", authMiddleware(["admin", "accounts", "staff"]), getSignedProofFileUrl);

export default router;