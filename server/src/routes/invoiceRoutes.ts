import express from "express";
import {
    createInvoice,
    getInvoices,
    getInvoice,
    updateInvoice,
    deleteInvoice,
    generateInvoicePDF,
} from "../controllers/invoiceControllers";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Create invoice (Accounts, Admin, Staff)
router.post("/", authMiddleware(["accounts", "admin", "staff"]), createInvoice);

// Get all invoices (Accounts, Admin, Staff)
router.get("/", authMiddleware(["accounts", "admin", "staff"]), getInvoices);

// Get single invoice (Accounts, Admin, Staff)
router.get("/:id", authMiddleware(["accounts", "admin", "staff"]), getInvoice);

// Update invoice (Accounts, Admin, Staff)
router.put("/:id", authMiddleware(["accounts", "admin", "staff"]), updateInvoice);

// Delete invoice (Accounts, Admin, Staff)
router.delete("/:id", authMiddleware(["accounts", "admin", "staff"]), deleteInvoice);

// Generate invoice PDF (Accounts, Admin, Staff)
router.get("/:id/pdf", authMiddleware(["accounts", "admin", "staff"]), generateInvoicePDF);

export default router;