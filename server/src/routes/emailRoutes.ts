import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
    createEmailList,
    getEmailLists,
    createEmailCampaign,
    sendEmailCampaign,
    getCampaignAnalytics,
    handleBrevoWebhook,
    addEmailToList,
    updateEmailCampaign,
    getCampaigns,
    scheduleCampaign,
} from "../controllers/emailController";
import multer from "multer";

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
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
        } else {
            cb(new Error("Only PDF, image, Office files, or CSV are allowed"));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.post("/lists", authMiddleware(["admin"]), createEmailList);
router.get("/lists", authMiddleware(["admin"]), getEmailLists);
router.post("/lists/:listId/contacts", authMiddleware(["admin"]), upload.single("csvFile"), addEmailToList);
router.post("/campaigns", authMiddleware(["admin"]), upload.array("attachments", 3), createEmailCampaign);
router.put("/campaigns/:id", authMiddleware(["admin"]), upload.array("attachments", 3), updateEmailCampaign);
router.get("/campaigns", authMiddleware(["admin"]), getCampaigns);
router.post("/campaigns/:id/send", authMiddleware(["admin"]), sendEmailCampaign);
router.get("/campaigns/:id/analytics", authMiddleware(["admin"]), getCampaignAnalytics);
router.post("/campaigns/:id/schedule", authMiddleware(["admin"]), scheduleCampaign);
router.post("/webhook", authMiddleware([], true), handleBrevoWebhook);

export default router;