"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGuestUser = exports.updateChatRoom = exports.postChatMessage = exports.createChatRoom = exports.getChatRooms = exports.markChatMessageRead = exports.getChatMessages = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getChatMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const roomId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const user = req.user;
    if (isNaN(roomId)) {
        res.status(400).json({ message: "Invalid room ID" });
        return;
    }
    try {
        const room = yield prisma.chatRoom.findUnique({
            where: { id: roomId },
            include: { guestUser: true },
        });
        if (!room) {
            res.status(404).json({ message: "Chat room not found" });
            return;
        }
        // Access control
        if (user) {
            if (user.role !== "admin" && room.userCognitoId !== user.id && (!room.guestUserId || room.guestUserId.toString() !== user.id)) {
                res.status(403).json({ message: "Unauthorized to access this room" });
                return;
            }
        }
        else if (!room.guestUserId) {
            res.status(401).json({ message: "Unauthorized: Guest access requires a guest user ID" });
            return;
        }
        const messages = yield prisma.chatMessage.findMany({
            where: { roomId },
            orderBy: { createdAt: "asc" }, // Changed to ascending for bottom-aligned notes
            skip: offset,
            take: limit,
        });
        const total = yield prisma.chatMessage.count({ where: { roomId } });
        res.json({
            data: messages,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            total,
        });
    }
    catch (error) {
        console.error("Error fetching chat notes:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getChatMessages = getChatMessages;
const markChatMessageRead = (io) => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const messageId = parseInt(req.params.messageId);
    const user = req.user;
    if (isNaN(messageId)) {
        res.status(400).json({ message: "Invalid message ID" });
        return;
    }
    try {
        const message = yield prisma.chatMessage.findUnique({
            where: { id: messageId },
            include: { room: { include: { guestUser: true } } },
        });
        if (!message) {
            res.status(404).json({ message: "Message not found" });
            return;
        }
        // Access control
        if (user) {
            if (user.role !== "admin" &&
                message.room.userCognitoId !== user.id &&
                (!message.room.guestUserId || message.room.guestUserId.toString() !== user.id)) {
                res.status(403).json({ message: "Unauthorized to mark this message as read" });
                return;
            }
        }
        else if (!message.room.guestUserId) {
            res.status(401).json({ message: "Unauthorized: Guest access requires a guest user ID" });
            return;
        }
        const updatedMessage = yield prisma.chatMessage.update({
            where: { id: messageId },
            data: { read: true },
        });
        io.to(`room-${message.roomId}`).emit("message-read", { messageId, roomId: message.roomId, read: true });
        res.json(updatedMessage);
    }
    catch (error) {
        console.error("Error marking message as read:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.markChatMessageRead = markChatMessageRead;
const getChatRooms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const user = req.user;
    try {
        const where = user && user.role === "admin" ? {} : {
            OR: [
                { userCognitoId: user === null || user === void 0 ? void 0 : user.id },
                { guestUserId: user ? parseInt(user.id) : undefined },
            ].filter(Boolean),
        };
        const rooms = yield prisma.chatRoom.findMany({
            where,
            include: {
                guestUser: true,
                user: { select: { name: true } },
            },
            orderBy: { updatedAt: "desc" },
            skip: offset,
            take: limit,
        });
        const total = yield prisma.chatRoom.count({ where });
        res.json({
            data: rooms,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            total,
        });
    }
    catch (error) {
        console.error("Error fetching chat rooms:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getChatRooms = getChatRooms;
const createChatRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, phone } = req.body;
    const user = req.user;
    try {
        const admin = yield prisma.admin.findFirst();
        if (!admin) {
            // console.error("No admin found in database");
            res.status(400).json({ message: "No admin available" });
            return;
        }
        let guestUserId = null;
        if (!user) {
            if (!name || !email) {
                // console.error("Missing name or email for guest user");
                res.status(400).json({ message: "Name and email are required for guest users" });
                return;
            }
            const guestUser = yield prisma.guestUser.upsert({
                where: { email },
                update: { name, phoneNumber: phone || null },
                create: { name, email, phoneNumber: phone || null },
            });
            guestUserId = guestUser.id;
        }
        // For admins, set userCognitoId to null; for users, verify existence in User table
        let userCognitoId = null;
        if (user && user.role !== 'admin') {
            const existingUser = yield prisma.user.findUnique({
                where: { cognitoId: user.id },
            });
            if (!existingUser) {
                // console.error(`User with cognitoId ${user.id} not found`);
                res.status(400).json({ message: `User with ID ${user.id} not found in database` });
                return;
            }
            userCognitoId = user.id;
        }
        const newRoom = yield prisma.chatRoom.create({
            data: {
                guestUserId,
                userCognitoId,
                adminCognitoId: admin.cognitoId,
            },
            include: { guestUser: true, user: { select: { name: true } } },
        });
        res.status(201).json(newRoom);
    }
    catch (error) {
        if (error instanceof Error) {
            // console.error("Error creating chat room:", error);
            res.status(500).json({ message: "Internal server error", error: error.message });
        }
        else {
            // console.error("Unexpected error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
});
exports.createChatRoom = createChatRoom;
const postChatMessage = (io) => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const roomId = parseInt(req.params.id);
    const { content } = req.body;
    const user = req.user;
    if (!content || isNaN(roomId)) {
        res.status(400).json({ message: "Invalid data: content and valid roomId are required" });
        return;
    }
    try {
        const room = yield prisma.chatRoom.findUnique({
            where: { id: roomId },
            include: { guestUser: true },
        });
        if (!room) {
            console.error("Chat room not found:", roomId);
            res.status(404).json({ message: "Chat room not found" });
            return;
        }
        let senderType;
        let senderId;
        if (user) {
            if (user.role === "admin") {
                senderType = "ADMIN";
                senderId = user.id;
            }
            else if (room.userCognitoId === user.id) {
                senderType = "USER";
                senderId = user.id;
            }
            else if (room.guestUserId && room.guestUserId.toString() === user.id) {
                senderType = "GUEST";
                senderId = room.guestUserId.toString();
            }
            else {
                res.status(403).json({ message: "Unauthorized to send notes in this room" });
                return;
            }
        }
        else if (room.guestUserId) {
            senderType = "GUEST";
            senderId = room.guestUserId.toString();
        }
        else {
            res.status(401).json({ message: "Unauthorized: Guest access requires a guest user ID" });
            return;
        }
        const newMessage = yield prisma.chatMessage.create({
            data: {
                content,
                senderId,
                senderType,
                roomId,
                read: false, // Initialize as unread
            },
        });
        io.to(`room-${roomId}`).emit("new-message", newMessage);
        res.status(201).json(newMessage);
    }
    catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.postChatMessage = postChatMessage;
const updateChatRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const roomId = parseInt(req.params.id);
    const { adminCognitoId } = req.body;
    const user = req.user;
    if (!user || user.role !== "admin") {
        res.status(401).json({ message: "Unauthorized: Only admins can update chat rooms" });
        return;
    }
    try {
        const updatedRoom = yield prisma.chatRoom.update({
            where: { id: roomId },
            data: Object.assign({}, (adminCognitoId && { adminCognitoId })),
            include: { guestUser: true, user: { select: { name: true } } },
        });
        res.json(updatedRoom);
    }
    catch (error) {
        console.error("Error updating chat room:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateChatRoom = updateChatRoom;
const createGuestUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email } = req.body;
    if (!name || !email) {
        res.status(400).json({ message: "Name and email are required" });
        return;
    }
    try {
        const guestUser = yield prisma.guestUser.create({
            data: { name, email },
        });
        res.status(201).json({ id: guestUser.id });
    }
    catch (error) {
        console.error("createGuestUser error:", error);
        res.status(500).json({ message: "Failed to create guest user" });
    }
});
exports.createGuestUser = createGuestUser;
