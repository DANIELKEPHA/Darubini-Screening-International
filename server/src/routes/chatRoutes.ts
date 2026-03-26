import express, { Router } from "express";
import { Server } from "socket.io";
import {
    getChatRooms,
    createChatRoom,
    getChatMessages,
    postChatMessage,
    updateChatRoom,
    createGuestUser,
    markChatMessageRead,
} from "../controllers/chatController";

const chatRoutes = (io: Server): Router => {
    const router = express.Router();

    router.get("/", getChatRooms);
    router.post("/", createChatRoom);
    router.get("/:id/messages", getChatMessages);
    router.post("/:id/messages", postChatMessage(io));
    router.get("/messages/:messageId/read", markChatMessageRead(io));
    router.patch("/:id", updateChatRoom);
    router.post("/guest", createGuestUser);

    return router;
};

export default chatRoutes;