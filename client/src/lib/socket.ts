import { io, Socket } from "socket.io-client";
import { fetchAuthSession } from "aws-amplify/auth";
import axios from "axios";

let socket: Socket | null = null;
let isConnecting = false;

export const getSocket = async (): Promise<Socket> => {
    if (socket && socket.connected) {
        console.log("getSocket: Returning existing connected socket");
        return socket;
    }
    if (isConnecting) {
        console.log("getSocket: Waiting for existing connection attempt");
        await new Promise((resolve) => {
            const interval = setInterval(() => {
                if (!isConnecting) {
                    clearInterval(interval);
                    resolve(socket);
                }
            }, 100);
        });
        if (socket && socket.connected) {
            console.log("getSocket: Returning connected socket after wait");
            return socket;
        }
    }

    console.log("getSocket: Initializing new socket connection");
    isConnecting = true;
    let authPayload: { token?: string; guestUserId?: string } = {};
    let retryCount = 0;
    const maxRetries = 2;

    const tryGetToken = async () => {
        try {
            const session = await fetchAuthSession({ forceRefresh: retryCount > 0 });
            const { idToken } = session.tokens ?? {};
            if (idToken) {
                authPayload = { token: idToken.toString() };
                console.log("getSocket: Using idToken");
                return true;
            } else {
                throw new Error("No idToken available");
            }
        } catch (error) {
            console.error("getSocket: Failed to fetch auth session:", error);
            return false;
        }
    };

    while (retryCount <= maxRetries) {
        if (await tryGetToken()) {
            break;
        }
        retryCount++;
        if (retryCount > maxRetries) {
            console.log("getSocket: Falling back to guest user");
            try {
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
                if (!apiBaseUrl) throw new Error("API base URL is not defined");

                const guestData = {
                    name: "Guest User",
                    email: `guest${Math.random().toString(36).substring(2, 10)}@example.com`,
                };
                const response = await axios.post(`${apiBaseUrl}/chat/guest`, guestData);
                const guestUserId = response.data?.id;
                if (!guestUserId) throw new Error("Guest user ID not returned");
                authPayload = { guestUserId: guestUserId.toString() };
                console.log("getSocket: Created guest user with ID:", guestUserId);
                break;
            } catch (apiError) {
                console.error("getSocket: Failed to create guest user:", apiError);
                isConnecting = false;
                throw new Error("Unable to initialize socket for guest user");
            }
        }
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || apiUrl?.replace(/^http/, "ws");

    if (!socketUrl) {
        isConnecting = false;
        throw new Error("No WebSocket URL configured");
    }

    if (socket) {
        console.log("getSocket: Disconnecting existing socket");
        socket.disconnect();
    }

    socket = io(socketUrl, {
        autoConnect: false,
        auth: authPayload,
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
        console.log("getSocket: Socket connected");
        isConnecting = false;
    });

    socket.on("connect_error", (err) => {
        console.error("getSocket: Connect error:", err.message);
        isConnecting = false;
    });

    socket.on("disconnect", () => {
        console.log("getSocket: Socket disconnected");
        isConnecting = false;
    });

    console.log("getSocket: Initiating connection");
    socket.connect();
    return socket;
};