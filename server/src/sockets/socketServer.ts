import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";
import axios from "axios";
import jwkToPem from "jwk-to-pem";

const prisma = new PrismaClient();

interface DecodedToken extends JwtPayload {
    sub: string;
    "custom:role"?: string;
}

interface SocketUser {
    type: "user" | "admin" | "guest" | "staff" | "accounts";
    id: string;
    name: string;
    email?: string;
    role?: string;
}

let jwksCache: { [kid: string]: string } | null = null;

async function getPem(kid: string): Promise<string> {
    if (!process.env.COGNITO_USER_POOL_ID || !process.env.NEXT_PUBLIC_AWS_REGION) {
        throw new Error("Missing COGNITO_USER_POOL_ID or NEXT_PUBLIC_AWS_REGION");
    }

    if (!jwksCache) {
        const jwksUrl = `https://cognito-idp.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
        const response = await axios.get(jwksUrl);
        jwksCache = {};
        response.data.keys.forEach((jwk: any) => {
            jwksCache![jwk.kid] = jwkToPem(jwk);
        });
    }

    const pem = jwksCache[kid];
    if (!pem) {
        throw new Error(`No matching JWK for kid: ${kid}`);
    }
    return pem;
}

export const setupSocketServer = (httpServer: any) => {
    const clientOrigin = process.env.CLIENT_URL;

    if (!clientOrigin) {
        throw new Error("CLIENT_URL is not defined. Set CLIENT_URL in your environment.");
    }

    const io = new Server(httpServer, {
        cors: {
            origin: clientOrigin,
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.use(async (socket: Socket, next) => {
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
                const decodedHeader = jwt.decode(token, { complete: true }) as { header: { kid: string } };
                if (!decodedHeader?.header?.kid) {
                    return next(new Error("Invalid token: Missing kid"));
                }

                // Verify token with JWKS
                const pem = await getPem(decodedHeader.header.kid);
                const decoded = jwt.verify(token, pem, { algorithms: ["RS256"] }) as DecodedToken;
                if (!decoded?.sub) {
                    return next(new Error("Invalid token"));
                }

                const userRole = typeof decoded["custom:role"] === "string" ? decoded["custom:role"].toLowerCase() : "";
                const userType = userRole === "admin" ? "admin" :
                    userRole === "staff" ? "staff" :
                        userRole === "accounts" ? "accounts" : "user";
                const userId = decoded.sub;

                let userDetails: { name: string; email: string } | null = null;

                // Check user type and fetch from appropriate table
                if (userType === "admin") {
                    userDetails = await prisma.admin.findUnique({
                        where: { cognitoId: userId },
                        select: { name: true, email: true },
                    });
                } else if (userType === "staff") {
                    userDetails = await prisma.staff.findUnique({
                        where: { cognitoId: userId },
                        select: { name: true, email: true },
                    });
                } else if (userType === "accounts") {
                    userDetails = await prisma.accounts.findUnique({
                        where: { cognitoId: userId },
                        select: { name: true, email: true },
                    });
                } else {
                    userDetails = await prisma.user.findUnique({
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
            } else {
                const guestUser = await prisma.guestUser.findUnique({
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
        } catch (error) {
            console.error("Socket authentication error:", error);
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", async (socket: Socket) => {
        const socketUser = socket.data.user as SocketUser;
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
            const rooms = await prisma.chatRoom.findMany();
            rooms.forEach((room: typeof rooms[number]) => {
                socket.join(`room-${room.id}`);
            });
        } else {
            const where = socketUser.type === "guest"
                ? { guestUserId: parseInt(socketUser.id) }
                : { userCognitoId: socketUser.id };
            const rooms = await prisma.chatRoom.findMany({ where });
            rooms.forEach((room) => {
                socket.join(`room-${room.id}`);
                console.log(`${socketUser.type === "guest" ? "Guest" : "User"} ${socketUser.name} joining room-${room.id}`);
            });
        }

        // --- EVENT HANDLERS ---

        // Chat events (existing)
        socket.on("chat:joinRoom", (roomId: number) => {
            socket.join(`room-${roomId}`);
            console.log(`${socketUser.type} ${socketUser.name} joined room-${roomId}`);
        });

        socket.on("chat:leaveRoom", (roomId: number) => {
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
    });

    // --- HELPER FUNCTIONS FOR EMITTING EVENTS ---

    // Emit new contact notification
    const emitNewContact = (contact: any) => {
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

        console.log(`✅ New contact broadcasted to ${io.sockets.adapter.rooms.get("contacts-room")?.size || 0} clients`);
    };

    // Emit contact deleted notification
    const emitContactDeleted = (contactId: number, deletedBy?: string) => {
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
    const emitContactUpdated = (contact: any) => {
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
        const rooms = io.sockets.adapter.rooms;
        return {
            total: io.sockets.sockets.size,
            contactsRoom: rooms.get("contacts-room")?.size || 0,
            byRole: {
                admin: rooms.get("role:admin")?.size || 0,
                accounts: rooms.get("role:accounts")?.size || 0,
                staff: rooms.get("role:staff")?.size || 0,
                user: rooms.get("role:user")?.size || 0,
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