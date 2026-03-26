"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const qrCodeController_1 = require("../controllers/qrCodeController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get('/generate-permanent', (0, authMiddleware_1.authMiddleware)(["admin"]), qrCodeController_1.generateQRCode);
router.post('/scan', (0, authMiddleware_1.authMiddleware)(["staff", "accounts", "admin"]), qrCodeController_1.validateQRCode);
exports.default = router;
