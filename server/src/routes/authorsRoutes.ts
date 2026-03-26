import express from 'express';
import { getAuthors, createAuthor, uploadAuthorProfile, getAuthorById } from '../controllers/authors';
import { authMiddleware } from '../middleware/authMiddleware';
import { multerErrorHandler } from '../middleware/multerErrorHandler';
import rateLimit from 'express-rate-limit';

// Rate limiting for admin routes
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit to 50 requests per window
    message: { message: 'Too many requests from this IP, please try again later.' },
});

const router = express.Router();

// Public route: Get author by ID
router.get('/:id', getAuthorById);

// Admin routes
router.get('/', authMiddleware(['admin', "accounts", "staff"]), adminLimiter, getAuthors);
router.post('/', authMiddleware(['admin',  "accounts", "staff"]), adminLimiter, uploadAuthorProfile, multerErrorHandler, createAuthor);

export default router;