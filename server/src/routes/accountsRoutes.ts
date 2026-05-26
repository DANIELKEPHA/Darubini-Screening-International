import express from "express";
import { getAccounts, createAccounts, updateAccounts } from "../controllers/accountsControllers";
import { authMiddleware } from "../middleware/authMiddleware";
import { upload } from "../middleware/upload";

const router = express.Router();

// GET - View Accounts profile
router.get(
    "/:cognitoId",
    authMiddleware(["admin", "accounts"]),
    getAccounts
);

// POST - Create Accounts (with profile picture)
router.post(
    "/",
    authMiddleware(["admin", "accounts"]),
    upload.single("profilePicture"),
    createAccounts
);

// PUT - Update Accounts (with profile picture)
router.put(
    "/:cognitoId",
    authMiddleware(["admin", "accounts"]),
    upload.single("profilePicture"),
    updateAccounts
);

export default router;