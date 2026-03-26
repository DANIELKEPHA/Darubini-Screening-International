"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ClientController_1 = require("../controllers/ClientController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
// === Single Client Operations ===
router.post("/", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), upload_1.upload.single("image"), ClientController_1.createClient);
router.get("/", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), ClientController_1.getClients);
router.get("/:id", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), ClientController_1.getClient);
router.patch("/:id", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), upload_1.upload.single("image"), ClientController_1.updateClient);
router.delete("/:id", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), ClientController_1.deleteClient);
router.post("/import-csv", (0, authMiddleware_1.authMiddleware)(["admin", "accounts", "staff"]), upload_1.upload.single("file"), ClientController_1.importClientsFromCSV);
exports.default = router;
