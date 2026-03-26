"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const cashAccountsControllers_1 = require("../controllers/cashAccountsControllers");
const router = express_1.default.Router();
router.post("/", (0, authMiddleware_1.authMiddleware)(["admin", "accounts"]), cashAccountsControllers_1.createCashAccount);
router.get("/", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), cashAccountsControllers_1.getCashAccounts);
router.get("/:id", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), cashAccountsControllers_1.getCashAccount);
router.get("/:id/daily-balance", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), cashAccountsControllers_1.getCashAccountDailyBalance);
router.put("/:id", (0, authMiddleware_1.authMiddleware)(["admin", "accounts"]), cashAccountsControllers_1.updateCashAccount);
router.post("/:id/deposit", (0, authMiddleware_1.authMiddleware)(["admin", "accounts"]), cashAccountsControllers_1.depositToCashAccount);
router.post("/:id/close", (0, authMiddleware_1.authMiddleware)(["admin", "accounts"]), cashAccountsControllers_1.closeCashAccount);
router.delete("/:id", (0, authMiddleware_1.authMiddleware)(["admin"]), cashAccountsControllers_1.deleteCashAccount);
exports.default = router;
