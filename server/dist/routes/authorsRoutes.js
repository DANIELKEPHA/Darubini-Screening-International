"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authors_1 = require("../controllers/authors");
const authMiddleware_1 = require("../middleware/authMiddleware");
const multerErrorHandler_1 = require("../middleware/multerErrorHandler");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Rate limiting for admin routes
const adminLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit to 50 requests per window
    message: { message: 'Too many requests from this IP, please try again later.' },
});
const router = express_1.default.Router();
// Public route: Get author by ID
router.get('/:id', authors_1.getAuthorById);
// Admin routes
router.get('/', (0, authMiddleware_1.authMiddleware)(['admin', "accounts", "staff"]), adminLimiter, authors_1.getAuthors);
router.post('/', (0, authMiddleware_1.authMiddleware)(['admin', "accounts", "staff"]), adminLimiter, authors_1.uploadAuthorProfile, multerErrorHandler_1.multerErrorHandler, authors_1.createAuthor);
exports.default = router;
