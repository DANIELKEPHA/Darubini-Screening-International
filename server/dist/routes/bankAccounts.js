"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const bankAccountsControllers_1 = require("../controllers/bankAccountsControllers");
const router = express_1.default.Router();
router.get('/', (0, authMiddleware_1.authMiddleware)(['admin', 'accounts', "staff"]), bankAccountsControllers_1.getBankAccounts);
router.post('/', (0, authMiddleware_1.authMiddleware)(['admin', 'accounts', "staff"]), bankAccountsControllers_1.createBankAccount);
router.put('/:id', (0, authMiddleware_1.authMiddleware)(['admin', 'accounts', "staff"]), bankAccountsControllers_1.updateBankAccount);
router.delete('/:id', (0, authMiddleware_1.authMiddleware)(['admin', 'accounts', "staff"]), bankAccountsControllers_1.deleteBankAccount);
exports.default = router;
