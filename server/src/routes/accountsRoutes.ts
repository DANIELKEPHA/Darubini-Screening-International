import express from "express";
import { getAccounts, createAccounts, updateAccounts } from "../controllers/accountsControllers";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/:cognitoId", authMiddleware(["admin", "accounts"]), getAccounts);
router.post("/", authMiddleware(["admin", "accounts"]), createAccounts);
router.put("/:cognitoId", authMiddleware(["admin", "accounts"]), updateAccounts);

export default router;