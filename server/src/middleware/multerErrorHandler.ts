import { ErrorRequestHandler } from 'express';
import multer from 'multer';

export const multerErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
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