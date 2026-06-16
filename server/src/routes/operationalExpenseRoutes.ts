import express from "express";
import {
  createOperationalExpense,
  getOperationalExpenses,
  getOperationalExpense,
  updateOperationalExpense,
  deleteOperationalExpense,
  approveOperationalExpense,
  downloadOperationalExpensePdf,
  reverseOperationalExpense,
  reverseAndEditOperationalExpense,
} from "../controllers/operationalExpenseControllers";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Routes
router.post("/", authMiddleware(["accounts", "staff", "admin"]), createOperationalExpense);
router.get("/", authMiddleware(["accounts", "staff", "admin"]), getOperationalExpenses);
router.get("/:id", authMiddleware(["accounts", "staff", "admin"]), getOperationalExpense);
router.put("/:id", authMiddleware(["accounts", "staff", "admin"]), updateOperationalExpense);
router.delete("/:id", authMiddleware(["accounts", "staff", "admin"]), deleteOperationalExpense);
router.post("/:id/approve", authMiddleware(["accounts", "admin"]), approveOperationalExpense);
router.get("/:id/download-pdf", authMiddleware(["accounts", "staff", "admin"]), downloadOperationalExpensePdf);
router.post("/:id/reverse", authMiddleware(["accounts", "admin"]), reverseOperationalExpense);
router.post("/:id/reverse-and-edit", authMiddleware(["accounts", "admin"]), reverseAndEditOperationalExpense);

export default router;