"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const emailController_1 = require("../controllers/emailController");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/gif",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/csv",
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Only PDF, image, Office files, or CSV are allowed"));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
router.post("/lists", (0, authMiddleware_1.authMiddleware)(["admin"]), emailController_1.createEmailList);
router.get("/lists", (0, authMiddleware_1.authMiddleware)(["admin"]), emailController_1.getEmailLists);
router.post("/lists/:listId/contacts", (0, authMiddleware_1.authMiddleware)(["admin"]), upload.single("csvFile"), emailController_1.addEmailToList);
router.post("/campaigns", (0, authMiddleware_1.authMiddleware)(["admin"]), upload.array("attachments", 3), emailController_1.createEmailCampaign);
router.put("/campaigns/:id", (0, authMiddleware_1.authMiddleware)(["admin"]), upload.array("attachments", 3), emailController_1.updateEmailCampaign);
router.get("/campaigns", (0, authMiddleware_1.authMiddleware)(["admin"]), emailController_1.getCampaigns);
router.post("/campaigns/:id/send", (0, authMiddleware_1.authMiddleware)(["admin"]), emailController_1.sendEmailCampaign);
router.get("/campaigns/:id/analytics", (0, authMiddleware_1.authMiddleware)(["admin"]), emailController_1.getCampaignAnalytics);
router.post("/campaigns/:id/schedule", (0, authMiddleware_1.authMiddleware)(["admin"]), emailController_1.scheduleCampaign);
router.post("/webhook", (0, authMiddleware_1.authMiddleware)([], true), emailController_1.handleBrevoWebhook);
exports.default = router;
