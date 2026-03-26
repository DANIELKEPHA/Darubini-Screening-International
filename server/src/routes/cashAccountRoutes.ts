import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
    createCashAccount,
    getCashAccounts,
    getCashAccount,
    updateCashAccount,
    deleteCashAccount,           // ← This will now be PERMANENT DELETE (restricted)
    depositToCashAccount,
    getCashAccountDailyBalance,
    // === NEW IMPORTS ===
    closeCashAccount,             // New: Close/Deactivate endpoint
} from "../controllers/cashAccountsControllers";

const router = express.Router();

router.post("/", authMiddleware(["admin", "accounts"]), createCashAccount);

router.get("/", authMiddleware(["admin", "accounts", "staff"]), getCashAccounts);

router.get("/:id", authMiddleware(["admin", "accounts", "staff"]), getCashAccount);

router.get("/:id/daily-balance", authMiddleware(["admin", "accounts", "staff"]), getCashAccountDailyBalance);

router.put("/:id", authMiddleware(["admin", "accounts"]), updateCashAccount);

router.post("/:id/deposit", authMiddleware(["admin", "accounts"]), depositToCashAccount);

router.post(
    "/:id/close",
    authMiddleware(["admin", "accounts"]),
    closeCashAccount
);

router.delete(
    "/:id",
    authMiddleware(["admin"]),
    deleteCashAccount
);

export default router;