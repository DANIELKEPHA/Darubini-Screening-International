import express from "express";
import {
    createClientExpense,
    getClientExpenses,
    getClientExpense,
    updateClientExpense,
    deleteClientExpense,
    approveClientExpense,
    cancelClientExpense,
    rejectClientExpense,
    downloadClientExpensePdf,
    downloadClientExpensesXlsx,
} from "../controllers/clientExpenseControllers";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authMiddleware(["accounts", "admin", "staff"]), createClientExpense);

router.get("/", authMiddleware(["accounts", "admin", "staff"]), getClientExpenses);

router.get("/:id", authMiddleware(["accounts", "admin", "staff"]), getClientExpense);

router.put("/:id", authMiddleware(["accounts", "admin", "staff"]), updateClientExpense);

router.delete("/:id", authMiddleware(["accounts", "admin", "staff"]), deleteClientExpense);

// Approve expense → mark as PAID (only accounts or admin)
router.post("/:id/approve", authMiddleware(["accounts", "admin"]), approveClientExpense);

router.post("/:id/cancel", authMiddleware(["accounts", "admin", "staff"]), cancelClientExpense);

router.post("/:id/reject", authMiddleware(["accounts", "admin", "staff"]), rejectClientExpense);

// Download single expense as PDF
router.get(
    "/:id/download-pdf",
    authMiddleware(["accounts", "admin", "staff"]),
    downloadClientExpensePdf
);

router.get(
    "/export/xlsx",
    authMiddleware(["accounts", "admin", "staff"]),
    downloadClientExpensesXlsx
);

export default router;