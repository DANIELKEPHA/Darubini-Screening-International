"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multerErrorHandler = void 0;
const multer_1 = __importDefault(require("multer"));
const multerErrorHandler = (err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
            return;
        }
        res.status(400).json({ message: `Multer error: ${err.message}` });
        return;
    }
    if (err.message.includes('Only JPEG, PNG, WebP, or PDF files are allowed')) {
        res.status(400).json({ message: err.message });
        return;
    }
    next(err); // Pass unhandled errors to the next error handler
};
exports.multerErrorHandler = multerErrorHandler;
