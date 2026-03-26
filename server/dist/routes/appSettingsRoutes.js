"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const appSettingsController_1 = require("../controllers/appSettingsController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Public endpoint (no authentication required)
router.get("/signup-settings", appSettingsController_1.getPublicSignUpSettings);
// Authenticated endpoints (admin-only)
router.get("/signup-enabled", (0, authMiddleware_1.authMiddleware)(["admin"]), appSettingsController_1.getSignUpEnabled);
router.put("/signup-enabled", (0, authMiddleware_1.authMiddleware)(["admin"]), appSettingsController_1.updateSignUpEnabled);
exports.default = router;
