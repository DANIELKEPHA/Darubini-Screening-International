"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const operationalExpenseControllers_1 = require("../controllers/operationalExpenseControllers");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Routes
router.post("/", (0, authMiddleware_1.authMiddleware)(["accounts", "staff", "admin"]), operationalExpenseControllers_1.createOperationalExpense);
router.post("/draft", (0, authMiddleware_1.authMiddleware)(["accounts", "staff", "admin"]), operationalExpenseControllers_1.createDraftOperationalExpense);
router.get("/", (0, authMiddleware_1.authMiddleware)(["accounts", "staff", "admin"]), operationalExpenseControllers_1.getOperationalExpenses);
router.get("/:id", (0, authMiddleware_1.authMiddleware)(["accounts", "staff", "admin"]), operationalExpenseControllers_1.getOperationalExpense);
router.put("/:id", (0, authMiddleware_1.authMiddleware)(["accounts", "staff", "admin"]), operationalExpenseControllers_1.updateOperationalExpense);
router.delete("/:id", (0, authMiddleware_1.authMiddleware)(["accounts", "staff", "admin"]), operationalExpenseControllers_1.deleteOperationalExpense);
router.post("/:id/approve", (0, authMiddleware_1.authMiddleware)(["accounts", "admin"]), operationalExpenseControllers_1.approveOperationalExpense);
router.get("/:id/download-pdf", (0, authMiddleware_1.authMiddleware)(["accounts", "staff", "admin"]), operationalExpenseControllers_1.downloadOperationalExpensePdf);
router.post("/:id/reverse", (0, authMiddleware_1.authMiddleware)(["accounts", "admin"]), operationalExpenseControllers_1.reverseOperationalExpense);
router.post("/:id/reverse-and-edit", (0, authMiddleware_1.authMiddleware)(["accounts", "admin"]), operationalExpenseControllers_1.reverseAndEditOperationalExpense);
exports.default = router;
