import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount } from "../controllers/bankAccountsControllers";

const router = express.Router();

router.get('/', authMiddleware(['admin', 'accounts', "staff"]), getBankAccounts);
router.post('/', authMiddleware(['admin', 'accounts', "staff"]), createBankAccount);
router.put('/:id', authMiddleware(['admin', 'accounts', "staff"]), updateBankAccount);
router.delete('/:id', authMiddleware(['admin', 'accounts', "staff"]), deleteBankAccount);

export default router;