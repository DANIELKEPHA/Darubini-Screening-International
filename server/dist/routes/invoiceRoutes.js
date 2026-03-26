"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const invoiceControllers_1 = require("../controllers/invoiceControllers");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Create invoice (Accounts, Admin, Staff)
router.post("/", (0, authMiddleware_1.authMiddleware)(["accounts", "admin", "staff"]), invoiceControllers_1.createInvoice);
// Get all invoices (Accounts, Admin, Staff)
router.get("/", (0, authMiddleware_1.authMiddleware)(["accounts", "admin", "staff"]), invoiceControllers_1.getInvoices);
// Get single invoice (Accounts, Admin, Staff)
router.get("/:id", (0, authMiddleware_1.authMiddleware)(["accounts", "admin", "staff"]), invoiceControllers_1.getInvoice);
// Update invoice (Accounts, Admin, Staff)
router.put("/:id", (0, authMiddleware_1.authMiddleware)(["accounts", "admin", "staff"]), invoiceControllers_1.updateInvoice);
// Delete invoice (Accounts, Admin, Staff)
router.delete("/:id", (0, authMiddleware_1.authMiddleware)(["accounts", "admin", "staff"]), invoiceControllers_1.deleteInvoice);
// Generate invoice PDF (Accounts, Admin, Staff)
router.get("/:id/pdf", (0, authMiddleware_1.authMiddleware)(["accounts", "admin", "staff"]), invoiceControllers_1.generateInvoicePDF);
exports.default = router;
