"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const transactionsControllers_1 = require("../controllers/transactionsControllers");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get('/', (0, authMiddleware_1.authMiddleware)(['admin', 'accounts', 'staff']), transactionsControllers_1.getTransactions);
router.post('/:id/reconcile', (0, authMiddleware_1.authMiddleware)(['admin', 'accounts']), transactionsControllers_1.reconcileTransaction);
exports.default = router;
