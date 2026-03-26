"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Home, MessageCircle, Minimize2, Maximize2, BookOpen, Send } from "lucide-react";
import Chat from "@/components/chat/Chat";
import {
    useCreateChatRoomMutation,
    useGetAuthUserQuery,
    useGetChatRoomsQuery,
    useCreateGuestUserMutation,
} from "@/state/api";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import AdminChatWidget from "@/components/chat/AdminChatWidget";
import { getCurrentUser } from "aws-amplify/auth";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

interface AuthUser {
    cognitoInfo: { userId: string };
    userInfo: any;
    userRole: string;
}

const isFetchBaseQueryError = (error: any): error is FetchBaseQueryError => {
    return (
        error != null &&
        typeof error === "object" &&
        "status" in error &&
        "data" in error
    );
};

const isSerializedError = (error: any): error is { message?: string } => {
    return error != null && typeof error === "object" && "message" in error;
};


const ChatWidget = () => {
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [roomId, setRoomId] = useState<number | null>(null);
    const [guestInfo, setGuestInfo] = useState<{ name: string; email: string; phone?: string } | null>(null);
    const [activeTab, setActiveTab] = useState<"home" | "messages" | "docs">("home");
    const [isTyping, setIsTyping] = useState(false);
    const [welcomeMessage, setWelcomeMessage] = useState("");
    const [dimensions, setDimensions] = useState({ width: 380, height: 560 });
    const chatWidgetRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const startSize = useRef({ width: 0, height: 0 });

    const { data: authUser, isLoading: authLoading, error: authError } = useGetAuthUserQuery(undefined, {
        skip: !open,
    });
    const { data: chatRooms, isLoading: roomsLoading, error: roomsError } = useGetChatRoomsQuery(
        { page: 1, limit: 20 },
        { skip: !open || (!authUser && !guestInfo) }
    );
    const [createGuestUser, { isLoading: guestLoading, error: guestError }] = useCreateGuestUserMutation();
    const [createChatRoom, { isLoading: roomLoading, error: roomError }] = useCreateChatRoomMutation();

    const isAdmin = authUser?.userRole === "admin";

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                await getCurrentUser();
            } catch (error: any) {
                console.log("No authenticated user, proceeding as guest");
                if (open) {
                    setActiveTab("home");
                }
            }
        };
        checkAuth();
    }, [open]);

    // Typing animation effect for welcome message
    useEffect(() => {
        if (activeTab === "home") {
            const fullMessage = "Hi there! 👋\nWelcome to Our Company Support.\nHow can we help you today?";
            let currentText = "";
            let i = 0;

            setIsTyping(true);
            const typingInterval = setInterval(() => {
                if (i < fullMessage.length) {
                    currentText += fullMessage[i];
                    setWelcomeMessage(currentText);
                    i++;
                } else {
                    clearInterval(typingInterval);
                    setIsTyping(false);
                }
            }, 30);

            return () => clearInterval(typingInterval);
        }
    }, [activeTab]);

    // Handle guest form submission
    const handleGuestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string | undefined;

        if (name && email) {
            try {
                console.log("Creating guest user:", { name, email, phone });
                const { id: guestUserId } = await createGuestUser({ name, email, phone }).unwrap();
                console.log("Guest user created:", guestUserId);
                setGuestInfo({ name, email, phone });
                const socket = await getSocket();
                socket.connect();
                setActiveTab("messages");
            } catch (error: any) {
                console.error("Guest creation error:", error);
                toast.error("Failed to create guest user");
            }
        } else {
            toast.error("Name and email are required");
        }
    };

    // Initialize chat room
    useEffect(() => {
        const initializeChatRoom = async () => {
            if (authLoading || roomsLoading || roomLoading || !open || roomId || !(authUser || (guestInfo && guestInfo.name && guestInfo.email))) {
                console.log("ChatWidget: Skipping room initialization", { authLoading, roomsLoading, roomLoading, open, roomId, hasAuth: !!authUser, hasGuest: !!(guestInfo && guestInfo.name && guestInfo.email) });
                return;
            }

            try {
                console.log("ChatWidget: Initializing chat room. AuthUser:", authUser, "GuestInfo:", guestInfo);
                if (chatRooms?.data?.length) {
                    const existingRoom = chatRooms.data.find(
                        (room) =>
                            (authUser && room.userCognitoId === authUser.cognitoInfo.userId) ||
                            (guestInfo && room.guestUser?.email === guestInfo.email)
                    );
                    if (existingRoom) {
                        console.log("ChatWidget: Found existing room:", existingRoom.id);
                        setRoomId(existingRoom.id);
                        const socket = await getSocket();
                        if (socket.connected) {
                            socket.emit("chat:joinRoom", existingRoom.id);
                        } else {
                            socket.connect();
                            socket.emit("chat:joinRoom", existingRoom.id);
                        }
                        return;
                    }
                }

                const guestInfoData = authUser ? {} : guestInfo!;
                console.log("ChatWidget: Creating chat room with data:", guestInfoData);
                const newRoom = await createChatRoom(guestInfoData).unwrap();
                console.log("ChatWidget: Created new room:", newRoom.id);
                setRoomId(newRoom.id);
                const socket = await getSocket();
                if (socket.connected) {
                    socket.emit("chat:joinRoom", newRoom.id);
                } else {
                    socket.connect();
                    socket.emit("chat:joinRoom", newRoom.id);
                }
            } catch (error: any) {
                console.error("ChatWidget: Chat room initialization failed:", error);
                toast.error("Failed to initialize chat room");
            }
        };

        if (open && !roomId && (authUser || (guestInfo && guestInfo.name && guestInfo.email))) {
            initializeChatRoom();
        }
    }, [open, roomId, authUser, guestInfo, chatRooms, createChatRoom, authLoading, roomsLoading, roomLoading]);

    // Error handling
    useEffect(() => {
        if (authError) {
            if (isFetchBaseQueryError(authError)) {
                // Handle FetchBaseQueryError (e.g., HTTP errors)
                const errorMessage = authError.data && typeof authError.data === "object" && "message" in authError.data
                    ? (authError.data as { message: string }).message
                    : `HTTP Error ${authError.status}`;
                if (errorMessage !== "No current user" && errorMessage !== "The user is not authenticated") {
                    console.error("Auth Error:", authError);
                    toast.error(errorMessage || "Could not load user data. Please try logging in again.");
                }
            } else if (isSerializedError(authError) && authError.message) {
                // Handle SerializedError (e.g., network or parsing errors)
                if (authError.message !== "No current user" && authError.message !== "The user is not authenticated") {
                    console.error("Auth Error:", authError);
                    toast.error(authError.message || "Could not load user data. Please try logging in again.");
                }
            }
        }
        if (roomsError) {
            const errorMessage = isFetchBaseQueryError(roomsError)
                ? (roomsError.data && typeof roomsError.data === "object" && "message" in roomsError.data
                    ? (roomsError.data as { message: string }).message
                    : `HTTP Error ${roomsError.status}`)
                : isSerializedError(roomsError) && roomsError.message
                    ? roomsError.message
                    : "Failed to load chat rooms";
            toast.error(errorMessage);
        }
        if (guestError) {
            const errorMessage = isFetchBaseQueryError(guestError)
                ? (guestError.data && typeof guestError.data === "object" && "message" in guestError.data
                    ? (guestError.data as { message: string }).message
                    : `HTTP Error ${guestError.status}`)
                : isSerializedError(guestError) && guestError.message
                    ? guestError.message
                    : "Failed to create guest user";
            toast.error(errorMessage);
        }
        if (roomError) {
            const errorMessage = isFetchBaseQueryError(roomError)
                ? (roomError.data && typeof roomError.data === "object" && "message" in roomError.data
                    ? (roomError.data as { message: string }).message
                    : `HTTP Error ${roomError.status}`)
                : isSerializedError(roomError) && roomError.message
                    ? roomError.message
                    : "Failed to create chat room";
            toast.error(errorMessage);
        }
    }, [authError, roomsError, guestError, roomError]);

    const toggleExpand = () => {
        if (expanded) {
            setDimensions({ width: 380, height: 560 });
        } else {
            setDimensions((prev) => ({
                width: Math.min(window.innerWidth - 40, prev.width * 1.8),
                height: Math.min(window.innerHeight - 100, prev.height * 1.3),
            }));
        }
        setExpanded(!expanded);
    };

    const startResize = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isResizing.current = true;
        startPos.current = { x: e.clientX, y: e.clientY };
        startSize.current = { ...dimensions };
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", stopResize);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;

        const deltaX = e.clientX - startPos.current.x;
        const deltaY = e.clientY - startPos.current.y;

        setDimensions({
            width: Math.max(350, Math.min(window.innerWidth - 40, startSize.current.width + deltaX)),
            height: Math.max(400, Math.min(window.innerHeight - 100, startSize.current.height + deltaY)),
        });
    };

    const stopResize = () => {
        isResizing.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", stopResize);
    };

    useEffect(() => {
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", stopResize);
        };
    }, []);

    if (isAdmin) {
        return <AdminChatWidget />;
    }

    return (
        <>
            {/* Floating chat button */}
            <motion.button
                onClick={() => setOpen(!open)}
                className="fixed bottom-6 right-6 z-50 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-all duration-200 group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Chat"
                disabled={authLoading || roomsLoading}
            >
                <MessageSquare className="w-5 h-5" />
            </motion.button>

            {/* Chat widget */}
            {open && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    ref={chatWidgetRef}
                    className="fixed bottom-20 right-6 z-[1000] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col border border-gray-200"
                    style={{
                        width: `${dimensions.width}px`,
                        height: `${dimensions.height}px`,
                    }}
                >
                    {/* Header */}
                    <div className="bg-white p-3 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
                                <Image
                                    src="/logo.png"
                                    alt="Company Logo"
                                    width={24}
                                    height={24}
                                    className="filter brightness-0 invert"
                                />
                            </div>
                            <div>
                                <div className="font-semibold text-sm">relations@darubiniscreening.com</div>
                                <div className="text-xs text-gray-500">Support</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleExpand}
                                className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                                aria-label={expanded ? "Minimize" : "Maximize"}
                            >
                                {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Content area */}
                    <div className="flex-1 overflow-y-auto bg-gray-50">
                        {authLoading || roomsLoading ? (
                            <div className="p-4 text-center text-gray-500">Loading...</div>
                        ) : activeTab === "home" ? (
                            <div className="p-4 h-full flex flex-col">
                                <div className="flex-1">
                                    <div className="bg-blue-50 p-3 rounded-lg whitespace-pre-wrap text-sm mb-6">
                                        {welcomeMessage}
                                        {isTyping && (
                                            <span className="inline-block ml-1 h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div
                                            className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={() => setActiveTab("messages")}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-100 p-2 rounded-full">
                                                    <Send className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-sm">Send us a message</h3>
                                                    <p className="text-xs text-gray-500">Chat with our support team</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={() => setActiveTab("docs")}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="bg-purple-100 p-2 rounded-full">
                                                    <BookOpen className="w-4 h-4 text-purple-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-sm">Documentation</h3>
                                                    <p className="text-xs text-gray-500">Browse our help articles</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {!authUser && !guestInfo && (
                                    <form onSubmit={handleGuestSubmit} className="mt-6 space-y-3">
                                        <p className="text-sm text-gray-600">Please enter your details to start chatting with our support team.</p>
                                        <div>
                                            <input
                                                name="name"
                                                type="text"
                                                placeholder="Your name"
                                                required
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                disabled={guestLoading}
                                            />
                                        </div>
                                        <div>
                                            <input
                                                name="email"
                                                type="email"
                                                placeholder="Your email"
                                                required
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                disabled={guestLoading}
                                            />
                                        </div>
                                        <div>
                                            <input
                                                name="phone"
                                                type="tel"
                                                placeholder="Your phone (optional)"
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                disabled={guestLoading}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                                            disabled={guestLoading}
                                        >
                                            {guestLoading ? "Creating..." : "Start Chat"}
                                        </button>
                                    </form>
                                )}
                            </div>
                        ) : activeTab === "docs" ? (
                            <div className="p-4 h-full overflow-y-auto">
                                <h2 className="font-semibold text-lg mb-4">Documentation</h2>
                                <div className="space-y-4">
                                    <div className="border-b border-gray-200 pb-4">
                                        <h3 className="font-medium text-blue-600 mb-2">Getting Started</h3>
                                        <p className="text-sm text-gray-700 mb-2">Learn how to set up your account and make the most of our platform.</p>
                                        <button className="text-sm text-blue-600 hover:underline">Read article →</button>
                                    </div>
                                    <div className="border-b border-gray-200 pb-4">
                                        <h3 className="font-medium text-blue-600 mb-2">Common Issues</h3>
                                        <p className="text-sm text-gray-700 mb-2">Troubleshooting guide for frequently encountered problems.</p>
                                        <button className="text-sm text-blue-600 hover:underline">Read article →</button>
                                    </div>
                                    <div className="border-b border-gray-200 pb-4">
                                        <h3 className="font-medium text-blue-600 mb-2">API Reference</h3>
                                        <p className="text-sm text-gray-700 mb-2">Complete documentation for our API endpoints.</p>
                                        <button className="text-sm text-blue-600 hover:underline">Read article →</button>
                                    </div>
                                    <div className="border-b border-gray-200 pb-4">
                                        <h3 className="font-medium text-blue-600 mb-2">Best Practices</h3>
                                        <p className="text-sm text-gray-700 mb-2">Recommendations for optimal performance and security.</p>
                                        <button className="text-sm text-blue-600 hover:underline">Read article →</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full">
                                {roomId ? (
                                    <Chat
                                        roomId={roomId}
                                        currentUserId={authUser?.cognitoInfo.userId || guestInfo?.email || ""}
                                        messageAlignment="left"
                                    />
                                ) : (
                                    <div className="p-4 text-center text-gray-500">Loading chat...</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer with tabs */}
                    <div className="bg-white border-t border-gray-200 flex">
                        <button
                            onClick={() => setActiveTab("home")}
                            className={cn(
                                "flex-1 py-3 flex items-center justify-center gap-2 text-sm",
                                activeTab === "home" ? "text-blue-600 border-t-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <Home className="w-4 h-4" />
                            <span>Home</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("messages")}
                            className={cn(
                                "flex-1 py-3 flex items-center justify-center gap-2 text-sm",
                                activeTab === "messages" ? "text-blue-600 border-t-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>Messages</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("docs")}
                            className={cn(
                                "flex-1 py-3 flex items-center justify-center gap-2 text-sm",
                                activeTab === "docs" ? "text-blue-600 border-t-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <BookOpen className="w-4 h-4" />
                            <span>Docs</span>
                        </button>
                    </div>

                    {/* Resize handle */}
                    <div
                        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-gray-200 hover:bg-gray-300"
                        onMouseDown={startResize}
                    />
                </motion.div>
            )}
        </>
    );
};

export default ChatWidget;