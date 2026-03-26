"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const clientExpenseControllers_1 = require("../controllers/clientExpenseControllers");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post("/", (0, authMiddleware_1.authMiddleware)(["accounts", "admin", "staff"]), clientExpenseControllers_1.createClientExpense);
router.get("/", (0, authMiddleware_1.authMiddleware)(["accounts", "admin", "staff"]), clientExpenseControllers_1.getClientExpenses);
router.get("/:id", (0, authMiddleware_1.authMiddleware)(["accounts", "admin", "staff"]), clientExpenseControllers_1.getClientExpense);
router.put("/:id", (0, authMiddleware_1.authMiddleware)(["accounts", "admin", "staff"]), clientExpenseControllers_1.updateClientExpense);
router.delete("/:id", (0, authMiddleware_1.authMiddleware)(["accounts", "admin", "staff"]), clientExpenseControllers_1.deleteClientExpense);
// Approve expense → mark as PAID (only accounts or admin)
router.post("/:id/approve", (0, authMiddleware_1.authMiddleware)(["accounts", "admin"]), clientExpenseControllers_1.approveClientExpense);
router.post("/:id/cancel", (0, authMiddleware_1.authMiddleware)(["accounts", "admin", "staff"]), clientExpenseControllers_1.cancelClientExpense);
router.post("/:id/reject", (0, authMiddleware_1.authMiddleware)(["accounts", "admin", "staff"]), clientExpenseControllers_1.rejectClientExpense);
// Download single expense as PDF
router.get("/:id/download-pdf", (0, authMiddleware_1.authMiddleware)(["accounts", "admin", "staff"]), clientExpenseControllers_1.downloadClientExpensePdf);
router.get("/export/xlsx", (0, authMiddleware_1.authMiddleware)(["accounts", "admin", "staff"]), clientExpenseControllers_1.downloadClientExpensesXlsx);
exports.default = router;
