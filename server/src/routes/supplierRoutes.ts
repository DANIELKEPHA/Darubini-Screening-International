import express from "express";
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from "../controllers/suppliersController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Get all suppliers (admin or accounts only)
router.get("/", authMiddleware(["admin", "accounts"]), getSuppliers);

// Create a new supplier (admin or accounts only)
router.post("/", authMiddleware(["admin", "accounts"]), createSupplier);

// Update a supplier by ID (admin or accounts only)
router.put("/:id", authMiddleware(["admin", "accounts"]), updateSupplier);

// Delete a supplier by ID (admin or accounts only)
router.delete("/:id", authMiddleware(["admin", "accounts"]), deleteSupplier);

export default router;