import { Router } from "express";
import { getPublicSignUpSettings, getSignUpEnabled, updateSignUpEnabled } from "../controllers/appSettingsController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Public endpoint (no authentication required)
router.get("/signup-settings", getPublicSignUpSettings);

// Authenticated endpoints (admin-only)
router.get("/signup-enabled", authMiddleware(["admin"]), getSignUpEnabled);
router.put("/signup-enabled", authMiddleware(["admin"]), updateSignUpEnabled);

export default router;