"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminControllers_1 = require("../controllers/adminControllers");
const authMiddleware_1 = require("../middleware/authMiddleware");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
router.get("/all-users", (0, authMiddleware_1.authMiddleware)(["admin"]), adminControllers_1.getAllUsers);
router.get("/:cognitoId", (0, authMiddleware_1.authMiddleware)(["admin"]), adminControllers_1.getAdmin);
router.post("/", (0, authMiddleware_1.authMiddleware)(["admin"]), upload_1.upload.single("profilePicture"), adminControllers_1.createAdmin);
router.put("/:cognitoId", (0, authMiddleware_1.authMiddleware)(["admin"]), upload_1.upload.single("profilePicture"), adminControllers_1.updateAdmin);
exports.default = router;
