import express from 'express';
import {
    createBlog,
    updateBlog,
    getBlogs,
    getPublicBlogs,
    getBlogBySlug,
    deleteBlog,
    saveBlogDraft,
    publishBlog,
    uploadBlogCover,
} from '../controllers/blogController';
import { authMiddleware } from '../middleware/authMiddleware';
import { multerErrorHandler } from '../middleware/multerErrorHandler';
import rateLimit from 'express-rate-limit';

// Rate limiting for public routes
const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit to 100 requests per window
    message: { message: 'Too many requests from this IP, please try again later.' },
});

// Rate limiting for admin routes (stricter)
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit to 50 requests per window
    message: { message: 'Too many requests from this IP, please try again later.' },
});

const router = express.Router();

// Public routes
router.get('/public', publicLimiter, getPublicBlogs);
router.get('/:slug', publicLimiter, getBlogBySlug);

// Admin routes
router.get('/', authMiddleware(["admin", "staff", "accounts"]), adminLimiter, getBlogs);
router.post('/', authMiddleware(["admin", "staff", "accounts"]), adminLimiter, uploadBlogCover, multerErrorHandler, createBlog);
router.put('/:id', authMiddleware(["admin", "staff", "accounts"]), adminLimiter, uploadBlogCover, multerErrorHandler, updateBlog);
router.delete('/:id', authMiddleware(["admin", "staff", "accounts"]), adminLimiter, deleteBlog);
router.post('/draft', authMiddleware(["admin", "staff", "accounts"]), adminLimiter, saveBlogDraft);
router.post('/:id/draft', authMiddleware(["admin", "staff", "accounts"]), adminLimiter, saveBlogDraft);
router.patch('/:id/publish', authMiddleware(["admin", "staff", "accounts"]), adminLimiter, publishBlog);


export default router;