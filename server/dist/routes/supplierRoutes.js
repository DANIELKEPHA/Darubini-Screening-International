"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const suppliersController_1 = require("../controllers/suppliersController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Get all suppliers (admin or accounts only)
router.get("/", (0, authMiddleware_1.authMiddleware)(["admin", "accounts"]), suppliersController_1.getSuppliers);
// Create a new supplier (admin or accounts only)
router.post("/", (0, authMiddleware_1.authMiddleware)(["admin", "accounts"]), suppliersController_1.createSupplier);
// Update a supplier by ID (admin or accounts only)
router.put("/:id", (0, authMiddleware_1.authMiddleware)(["admin", "accounts"]), suppliersController_1.updateSupplier);
// Delete a supplier by ID (admin or accounts only)
router.delete("/:id", (0, authMiddleware_1.authMiddleware)(["admin", "accounts"]), suppliersController_1.deleteSupplier);
exports.default = router;
