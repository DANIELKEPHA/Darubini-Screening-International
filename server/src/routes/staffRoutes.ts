import express from "express";
import { getStaff, createStaff, updateStaff } from "../controllers/staffControllers";
import { authMiddleware } from "../middleware/authMiddleware";
import { upload } from "../middleware/upload";

const router = express.Router();

// GET - View Staff profile
router.get(
    "/:cognitoId",
    authMiddleware(["admin", "staff"]),
    getStaff
);

// POST - Create Staff (with profile picture)
router.post(
    "/",
    authMiddleware(["admin", "staff"]),
    upload.single("profilePicture"),
    createStaff
);

// PUT - Update Staff (with profile picture)
router.put(
    "/:cognitoId",
    authMiddleware(["admin", "staff"]),
    upload.single("profilePicture"),
    updateStaff
);

export default router;