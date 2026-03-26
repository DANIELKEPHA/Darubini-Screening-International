"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const paymentsControllers_1 = require("../controllers/paymentsControllers");
const router = express_1.default.Router();
router.post('/', (0, authMiddleware_1.authMiddleware)(['admin', 'accounts']), paymentsControllers_1.initiatePayment);
router.post('/webhook', paymentsControllers_1.handlePaymentWebhook);
router.post('/ipn', paymentsControllers_1.ipnListener);
exports.default = router;
