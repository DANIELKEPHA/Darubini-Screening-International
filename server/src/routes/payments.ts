import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {handlePaymentWebhook, initiatePayment, ipnListener} from "../controllers/paymentsControllers";

const router = express.Router();

router.post('/', authMiddleware(['admin', 'accounts']), initiatePayment);
router.post('/webhook', handlePaymentWebhook);
router.post('/ipn', ipnListener);

export default router;