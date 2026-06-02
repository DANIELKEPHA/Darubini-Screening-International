"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const accountsControllers_1 = require("../controllers/accountsControllers");
const authMiddleware_1 = require("../middleware/authMiddleware");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
router.get("/:cognitoId", (0, authMiddleware_1.authMiddleware)(["admin", "accounts"]), accountsControllers_1.getAccounts);
router.post("/", (0, authMiddleware_1.authMiddleware)(["admin", "accounts"]), upload_1.upload.single("profilePicture"), accountsControllers_1.createAccounts);
router.put("/:cognitoId", (0, authMiddleware_1.authMiddleware)(["admin", "accounts"]), upload_1.upload.single("profilePicture"), accountsControllers_1.updateAccounts);
exports.default = router;
