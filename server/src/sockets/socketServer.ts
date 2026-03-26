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
    type: "user" | "admin" | "guest";
    id: string;
    name: string;
    email?: string;
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
                const userType = userRole === "admin" ? "admin" : "user";
                const userId = decoded.sub;

                let userDetails: { name: string; email: string } | null = null;
                if (userType === "admin") {
                    userDetails = await prisma.admin.findUnique({
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

        if (socketUser.type === "admin") {
            const rooms = await prisma.chatRoom.findMany();
            rooms.forEach((room: typeof rooms[number]) => {
                socket.join(`room-${room.id}`);
            });

        } else {
            const where = socketUser.type === "guest" ? { guestUserId: parseInt(socketUser.id) } : { userCognitoId: socketUser.id };
            const rooms = await prisma.chatRoom.findMany({ where });
            rooms.forEach((room) => {
                socket.join(`room-${room.id}`);
                console.log(`${socketUser.type === "guest" ? "Guest" : "User"} ${socketUser.name} joining room-${room.id}`);
            });
        }

        socket.on("chat:joinRoom", (roomId: number) => {
            socket.join(`room-${roomId}`);
            console.log(`${socketUser.type} ${socketUser.name} joined room-${roomId}`);
        });

        socket.on("chat:leaveRoom", (roomId: number) => {
            socket.leave(`room-${roomId}`);
            console.log(`${socketUser.type} ${socketUser.name} left room-${roomId}`);
        });

        socket.on("disconnect", () => {
            console.log(`${socketUser.type} disconnected:`, socketUser.id);
        });
    });

    return io;
};