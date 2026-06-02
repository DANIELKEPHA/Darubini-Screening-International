import express from "express";
import { getAccounts, createAccounts, updateAccounts } from "../controllers/accountsControllers";
import { authMiddleware } from "../middleware/authMiddleware";
import { upload } from "../middleware/upload";

const router = express.Router();

router.get(
    "/:cognitoId",
    authMiddleware(["admin", "accounts"]),
    getAccounts
);

router.post(
    "/",
    authMiddleware(["admin", "accounts"]),
    upload.single("profilePicture"),
    createAccounts
);

router.put(
    "/:cognitoId",
    authMiddleware(["admin", "accounts"]),
    upload.single("profilePicture"),
    updateAccounts
);

export default router;