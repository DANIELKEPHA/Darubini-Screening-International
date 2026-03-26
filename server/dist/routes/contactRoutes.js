"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const contactControllers_1 = require("../controllers/contactControllers");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public route for creating contact submissions
router.post("/", contactControllers_1.createContact);
// Protected routes for admins/managers to view and delete contacts
router.get("/", (0, authMiddleware_1.authMiddleware)(["admin"]), contactControllers_1.getContacts);
router.get("/:id", (0, authMiddleware_1.authMiddleware)(["admin"]), contactControllers_1.getContact);
router.delete("/:id", (0, authMiddleware_1.authMiddleware)(["admin"]), contactControllers_1.deleteContact);
exports.default = router;
