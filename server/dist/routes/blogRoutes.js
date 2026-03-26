"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const blogController_1 = require("../controllers/blogController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const multerErrorHandler_1 = require("../middleware/multerErrorHandler");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Rate limiting for public routes
const publicLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit to 100 requests per window
    message: { message: 'Too many requests from this IP, please try again later.' },
});
// Rate limiting for admin routes (stricter)
const adminLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit to 50 requests per window
    message: { message: 'Too many requests from this IP, please try again later.' },
});
const router = express_1.default.Router();
// Public routes
router.get('/public', publicLimiter, blogController_1.getPublicBlogs);
router.get('/:slug', publicLimiter, blogController_1.getBlogBySlug);
// Admin routes
router.get('/', (0, authMiddleware_1.authMiddleware)(["admin", "staff", "accounts"]), adminLimiter, blogController_1.getBlogs);
router.post('/', (0, authMiddleware_1.authMiddleware)(["admin", "staff", "accounts"]), adminLimiter, blogController_1.uploadBlogCover, multerErrorHandler_1.multerErrorHandler, blogController_1.createBlog);
router.put('/:id', (0, authMiddleware_1.authMiddleware)(["admin", "staff", "accounts"]), adminLimiter, blogController_1.uploadBlogCover, multerErrorHandler_1.multerErrorHandler, blogController_1.updateBlog);
router.delete('/:id', (0, authMiddleware_1.authMiddleware)(["admin", "staff", "accounts"]), adminLimiter, blogController_1.deleteBlog);
router.post('/draft', (0, authMiddleware_1.authMiddleware)(["admin", "staff", "accounts"]), adminLimiter, blogController_1.saveBlogDraft);
router.post('/:id/draft', (0, authMiddleware_1.authMiddleware)(["admin", "staff", "accounts"]), adminLimiter, blogController_1.saveBlogDraft);
router.patch('/:id/publish', (0, authMiddleware_1.authMiddleware)(["admin", "staff", "accounts"]), adminLimiter, blogController_1.publishBlog);
exports.default = router;
