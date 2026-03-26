"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatController_1 = require("../controllers/chatController");
const chatRoutes = (io) => {
    const router = express_1.default.Router();
    router.get("/", chatController_1.getChatRooms);
    router.post("/", chatController_1.createChatRoom);
    router.get("/:id/messages", chatController_1.getChatMessages);
    router.post("/:id/messages", (0, chatController_1.postChatMessage)(io));
    router.get("/messages/:messageId/read", (0, chatController_1.markChatMessageRead)(io));
    router.patch("/:id", chatController_1.updateChatRoom);
    router.post("/guest", chatController_1.createGuestUser);
    return router;
};
exports.default = chatRoutes;
