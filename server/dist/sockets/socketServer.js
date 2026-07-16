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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketServer = void 0;
const socket_io_1 = require("socket.io");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
const jwk_to_pem_1 = __importDefault(require("jwk-to-pem"));
const prisma = new client_1.PrismaClient();
let jwksCache = null;
function getPem(kid) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!process.env.COGNITO_USER_POOL_ID || !process.env.NEXT_PUBLIC_AWS_REGION) {
            throw new Error("Missing COGNITO_USER_POOL_ID or NEXT_PUBLIC_AWS_REGION");
        }
        if (!jwksCache) {
            const jwksUrl = `https://cognito-idp.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
            const response = yield axios_1.default.get(jwksUrl);
            jwksCache = {};
            response.data.keys.forEach((jwk) => {
                jwksCache[jwk.kid] = (0, jwk_to_pem_1.default)(jwk);
            });
        }
        const pem = jwksCache[kid];
        if (!pem) {
            throw new Error(`No matching JWK for kid: ${kid}`);
        }
        return pem;
    });
}
const setupSocketServer = (httpServer) => {
    const clientOrigin = process.env.CLIENT_URL;
    if (!clientOrigin) {
        throw new Error("CLIENT_URL is not defined. Set CLIENT_URL in your environment.");
    }
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: clientOrigin,
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = socket.handshake.auth.token;
        const guestUserId = socket.handshake.auth.guestUserId;
        if (!token && !guestUserId) {
            return next(new Error("Authentication error: No token or guest ID provided"));
        }
        try {
            if (token) {
                if (!process.env.COGNITO_USER_POOL_ID || !process.env.COGNITO_CLIENT_ID) {
                    return next(new Error("Server configuration error: Missing environment variables"));
                }
                // Decode token to get kid (without verification)
                const decodedHeader = jsonwebtoken_1.default.decode(token, { complete: true });
                if (!((_a = decodedHeader === null || decodedHeader === void 0 ? void 0 : decodedHeader.header) === null || _a === void 0 ? void 0 : _a.kid)) {
                    return next(new Error("Invalid token: Missing kid"));
                }
                // Verify token with JWKS
                const pem = yield getPem(decodedHeader.header.kid);
                const decoded = jsonwebtoken_1.default.verify(token, pem, { algorithms: ["RS256"] });
                if (!(decoded === null || decoded === void 0 ? void 0 : decoded.sub)) {
                    return next(new Error("Invalid token"));
                }
                const userRole = typeof decoded["custom:role"] === "string" ? decoded["custom:role"].toLowerCase() : "";
                const userType = userRole === "admin" ? "admin" :
                    userRole === "staff" ? "staff" :
                        userRole === "accounts" ? "accounts" : "user";
                const userId = decoded.sub;
                let userDetails = null;
                // Check user type and fetch from appropriate table
                if (userType === "admin") {
                    userDetails = yield prisma.admin.findUnique({
                        where: { cognitoId: userId },
                        select: { name: true, email: true },
                    });
                }
                else if (userType === "staff") {
                    userDetails = yield prisma.staff.findUnique({
                        where: { cognitoId: userId },
                        select: { name: true, email: true },
                    });
                }
                else if (userType === "accounts") {
                    userDetails = yield prisma.accounts.findUnique({
                        where: { cognitoId: userId },
                        select: { name: true, email: true },
                    });
                }
                else {
                    userDetails = yield prisma.user.findUnique({
                        where: { cognitoId: userId },
                        select: { name: true, email: true },
                    });
                }
                if (!userDetails) {
                    return next(new Error("User not found in database"));
                }
                socket.data.user = {
                    type: userType,
                    id: userId,
                    name: userDetails.name,
                    email: userDetails.email || undefined,
                    role: userRole,
                };
            }
            else {
                const guestUser = yield prisma.guestUser.findUnique({
                    where: { id: parseInt(guestUserId) },
                    select: { id: true, name: true, email: true },
                });
                if (!guestUser) {
                    return next(new Error("Invalid guest user ID"));
                }
                socket.data.user = {
                    type: "guest",
                    id: guestUser.id.toString(),
                    name: guestUser.name,
                    email: guestUser.email,
                };
            }
            next();
        }
        catch (error) {
            console.error("Socket authentication error:", error);
            next(new Error("Authentication error"));
        }
    }));
    io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
        const socketUser = socket.data.user;
        console.log(`🔌 ${socketUser.type} connected:`, socketUser);
        // Join user-specific room
        socket.join(`user:${socketUser.id}`);
        if (socketUser.type !== "guest") {
            socket.join(`role:${socketUser.type}`);
        }
        // --- CONTACT NOTIFICATIONS ---
        // Join contacts room for admins, accounts, and staff
        if (["admin", "accounts", "staff"].includes(socketUser.type)) {
            socket.join("contacts-room");
            console.log(`📨 ${socketUser.type} ${socketUser.name} joined contacts room`);
            // Send confirmation
            socket.emit("contacts:joined", {
                message: "You are now receiving contact notifications",
                timestamp: new Date().toISOString(),
            });
        }
        // --- CHAT ROOMS (existing) ---
        if (socketUser.type === "admin") {
            const rooms = yield prisma.chatRoom.findMany();
            rooms.forEach((room) => {
                socket.join(`room-${room.id}`);
            });
        }
        else {
            const where = socketUser.type === "guest"
                ? { guestUserId: parseInt(socketUser.id) }
                : { userCognitoId: socketUser.id };
            const rooms = yield prisma.chatRoom.findMany({ where });
            rooms.forEach((room) => {
                socket.join(`room-${room.id}`);
                console.log(`${socketUser.type === "guest" ? "Guest" : "User"} ${socketUser.name} joining room-${room.id}`);
            });
        }
        // --- EVENT HANDLERS ---
        // Chat events (existing)
        socket.on("chat:joinRoom", (roomId) => {
            socket.join(`room-${roomId}`);
            console.log(`${socketUser.type} ${socketUser.name} joined room-${roomId}`);
        });
        socket.on("chat:leaveRoom", (roomId) => {
            socket.leave(`room-${roomId}`);
            console.log(`${socketUser.type} ${socketUser.name} left room-${roomId}`);
        });
        // Contact events
        socket.on("contacts:subscribe", () => {
            socket.join("contacts-room");
            console.log(`📨 ${socketUser.type} ${socketUser.name} subscribed to contacts room`);
            socket.emit("contacts:subscribed", {
                message: "Successfully subscribed to contact notifications",
                timestamp: new Date().toISOString(),
            });
        });
        socket.on("contacts:unsubscribe", () => {
            socket.leave("contacts-room");
            console.log(`📨 ${socketUser.type} ${socketUser.name} unsubscribed from contacts room`);
            socket.emit("contacts:unsubscribed", {
                message: "Unsubscribed from contact notifications",
                timestamp: new Date().toISOString(),
            });
        });
        // Heartbeat
        socket.on("ping", () => {
            socket.emit("pong", { timestamp: new Date().toISOString() });
        });
        socket.on("disconnect", () => {
            console.log(`${socketUser.type} disconnected:`, socketUser.id);
        });
    }));
    // --- HELPER FUNCTIONS FOR EMITTING EVENTS ---
    // Emit new contact notification
    const emitNewContact = (contact) => {
        var _a;
        console.log(`📨 Broadcasting new contact notification for: ${contact.name}`);
        const payload = {
            type: "NEW_CONTACT",
            data: contact,
            timestamp: new Date().toISOString(),
        };
        // Emit to all users in the contacts room (admins, accounts, staff)
        io.to("contacts-room").emit("contacts:new", payload);
        // Also emit to specific role rooms for redundancy
        io.to("role:admin").emit("contacts:new", payload);
        io.to("role:accounts").emit("contacts:new", payload);
        io.to("role:staff").emit("contacts:new", payload);
        console.log(`✅ New contact broadcasted to ${((_a = io.sockets.adapter.rooms.get("contacts-room")) === null || _a === void 0 ? void 0 : _a.size) || 0} clients`);
    };
    // Emit contact deleted notification
    const emitContactDeleted = (contactId, deletedBy) => {
        console.log(`🗑️ Broadcasting contact deletion for ID: ${contactId}`);
        const payload = {
            type: "CONTACT_DELETED",
            contactId,
            deletedBy: deletedBy || "system",
            timestamp: new Date().toISOString(),
        };
        io.to("contacts-room").emit("contacts:deleted", payload);
        io.to("role:admin").emit("contacts:deleted", payload);
    };
    // Emit contact updated notification
    const emitContactUpdated = (contact) => {
        console.log(`📝 Broadcasting contact update for ID: ${contact.id}`);
        const payload = {
            type: "CONTACT_UPDATED",
            data: contact,
            timestamp: new Date().toISOString(),
        };
        io.to("contacts-room").emit("contacts:updated", payload);
    };
    // Get connected users count
    const getConnectedUsers = () => {
        var _a, _b, _c, _d, _e;
        const rooms = io.sockets.adapter.rooms;
        return {
            total: io.sockets.sockets.size,
            contactsRoom: ((_a = rooms.get("contacts-room")) === null || _a === void 0 ? void 0 : _a.size) || 0,
            byRole: {
                admin: ((_b = rooms.get("role:admin")) === null || _b === void 0 ? void 0 : _b.size) || 0,
                accounts: ((_c = rooms.get("role:accounts")) === null || _c === void 0 ? void 0 : _c.size) || 0,
                staff: ((_d = rooms.get("role:staff")) === null || _d === void 0 ? void 0 : _d.size) || 0,
                user: ((_e = rooms.get("role:user")) === null || _e === void 0 ? void 0 : _e.size) || 0,
            }
        };
    };
    // Return both io instance and helper functions
    return {
        io,
        emitNewContact,
        emitContactDeleted,
        emitContactUpdated,
        getConnectedUsers,
    };
};
exports.setupSocketServer = setupSocketServer;
