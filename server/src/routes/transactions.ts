import express from 'express';
import { getTransactions, reconcileTransaction } from '../controllers/transactionsControllers';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authMiddleware(['admin', 'accounts', 'staff']), getTransactions);
router.post('/:id/reconcile', authMiddleware(['admin', 'accounts']), reconcileTransaction);

export default router;