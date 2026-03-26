// src/middleware/upload.ts
import multer from "multer";

const storage = multer.memoryStorage(); // Keep file in RAM → perfect for direct S3 upload

export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const isValid = allowedTypes.test(file.mimetype);
        if (isValid) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed (JPEG, PNG, GIF, WebP)"));
        }
    },
});