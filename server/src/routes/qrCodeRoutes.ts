import { Router } from 'express';
import { generateQRCode, validateQRCode } from '../controllers/qrCodeController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/generate-permanent', authMiddleware(["admin"]), generateQRCode);
router.post('/scan', authMiddleware(["staff", "accounts", "admin"]), validateQRCode);

export default router;