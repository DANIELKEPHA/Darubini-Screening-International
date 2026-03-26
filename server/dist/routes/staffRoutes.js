"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const staffControllers_1 = require("../controllers/staffControllers");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get("/:cognitoId", (0, authMiddleware_1.authMiddleware)(["admin", "staff"]), staffControllers_1.getStaff);
router.post("/", (0, authMiddleware_1.authMiddleware)(["admin", "staff"]), staffControllers_1.createStaff);
router.put("/:cognitoId", (0, authMiddleware_1.authMiddleware)(["admin", "staff"]), staffControllers_1.updateStaff);
exports.default = router;
