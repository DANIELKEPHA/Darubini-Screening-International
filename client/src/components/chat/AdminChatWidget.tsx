"use client";

import React, { useState, useEffect } from "react";
import { useGetChatRoomsQuery } from "@/state/api";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import Chat from "@/components/chat/Chat";
import { Socket } from "socket.io-client";
import { FiMoreVertical, FiSearch, FiRefreshCw } from "react-icons/fi";
import { BsCheck2All } from "react-icons/bs";

interface ChatRoom {
    id: number;
    userCognitoId?: string;
    guestUser?: { id: number; name: string; email: string };
    user?: { name: string };
    unreadMessages: number;
    lastMessage?: {
        content: string;
        createdAt: string;
        read: boolean;
        senderType: "USER" | "ADMIN" | "GUEST";
    };
}

const AdminChatWidget = () => {
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connecting");
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const maxReconnectAttempts = 5;
    const { data: roomsData, error: roomsError, isLoading } = useGetChatRoomsQuery({ page: 1, limit: 50 });

    useEffect(() => {
        if (roomsError) {
            toast.error(`Failed to load chat rooms: ${JSON.stringify(roomsError)}`);
        }
    }, [roomsError]);

    // Initialize chat rooms with zero unread notes
    useEffect(() => {
        if (roomsData?.data) {
            setChatRooms(
                roomsData.data.map((room: any) => ({
                    ...room,
                    unreadMessages: 0,
                    lastMessage: room.lastMessage
                        ? {
                            ...room.lastMessage,
                            senderType: room.lastMessage.senderType || "USER",
                        }
                        : null,
                }))
            );
        }
    }, [roomsData]);

    useEffect(() => {
        let reconnectTimeout: NodeJS.Timeout;

        const initializeSocket = async () => {
            try {
                const socketInstance = await getSocket();
                setSocket(socketInstance);

                socketInstance.on("connect", () => {
                    console.log("Admin socket connected");
                    setConnectionStatus("connected");
                    setReconnectAttempts(0);
                    roomsData?.data.forEach((room: ChatRoom) => {
                        socketInstance.emit("chat:joinRoom", room.id);
                    });
                });

                socketInstance.on("connect_error", (error) => {
                    console.error("Socket connection error:", error);
                    setConnectionStatus("disconnected");
                    if (reconnectAttempts < maxReconnectAttempts) {
                        reconnectTimeout = setTimeout(() => {
                            setReconnectAttempts((prev) => prev + 1);
                            socketInstance.connect();
                        }, 3000 * (reconnectAttempts + 1));
                    } else {
                        toast.error("Failed to connect to chat server after multiple attempts");
                    }
                });

                socketInstance.on("disconnect", () => {
                    setConnectionStatus("disconnected");
                    toast.error("Disconnected from chat server. Attempting to reconnect...");
                });

                socketInstance.on("new-message", (msg: any) => {
                    if (msg.senderType !== "ADMIN") {
                        setChatRooms((prev) =>
                            prev.map((room) =>
                                room.id === msg.roomId
                                    ? {
                                        ...room,
                                        unreadMessages: room.unreadMessages + (msg.read ? 0 : 1),
                                        lastMessage: {
                                            content: msg.content,
                                            createdAt: msg.createdAt,
                                            read: msg.read,
                                            senderType: msg.senderType,
                                        },
                                    }
                                    : room
                            )
                        );
                    }
                });

                socketInstance.on("message-read", ({ messageId, read }: { messageId: number; read: boolean }) => {
                    setChatRooms((prev) =>
                        prev.map((room) =>
                            room.id === selectedRoomId && read
                                ? { ...room, unreadMessages: Math.max(0, room.unreadMessages - 1) }
                                : room
                        )
                    );
                });

                socketInstance.connect();
            } catch (error) {
                console.error("AdminChatWidget: Failed to initialize socket:", error);
                setConnectionStatus("disconnected");
                toast.error("Failed to connect to chat server");
            }
        };

        if (roomsData?.data) {
            initializeSocket();
        }

        return () => {
            if (socket) {
                socket.off("connect");
                socket.off("connect_error");
                socket.off("disconnect");
                socket.off("new-message");
                socket.off("message-read");
                socket.disconnect();
            }
            clearTimeout(reconnectTimeout);
        };
    }, [roomsData, selectedRoomId, reconnectAttempts]);

    const handleReconnect = () => {
        if (socket) {
            setReconnectAttempts(0);
            setConnectionStatus("connecting");
            socket.connect();
        }
    };

    const handleRoomSelect = async (roomId: number) => {
        if (selectedRoomId) {
            socket?.emit("chat:leaveRoom", selectedRoomId);
        }
        setSelectedRoomId(roomId);
        socket?.emit("chat:joinRoom", roomId);
        setChatRooms((prev) =>
            prev.map((room) =>
                room.id === roomId ? { ...room, unreadMessages: 0 } : room
            )
        );
    };

    const filteredRooms = chatRooms.filter(
        (room) =>
            room.guestUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatTime = (dateString?: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar for Chat Rooms */}
            <div
                className={`${
                    selectedRoomId ? "hidden md:flex" : "flex"
                } flex-col w-full md:w-1/3 bg-white border-r border-gray-200`}
            >
                <div className="bg-gray-100 p-3 flex justify-between items-center">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600">A</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-500">
                        <button
                            onClick={handleReconnect}
                            className="p-1 hover:text-gray-700"
                            title="Reconnect"
                            disabled={connectionStatus === "connected"}
                        >
                            <FiRefreshCw
                                size={20}
                                className={connectionStatus === "connecting" ? "animate-spin" : ""}
                            />
                        </button>
                        <FiMoreVertical size={20} className="cursor-pointer" />
                    </div>
                </div>

                <div className="p-2 bg-gray-50">
                    <div className="bg-white rounded-lg flex items-center px-3 py-1">
                        <FiSearch size={18} className="text-gray-500 mr-2" />
                        <input
                            type="text"
                            placeholder="Search or start new chat"
                            className="w-full py-1 outline-none text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {connectionStatus === "disconnected" && (
                        <div className="p-4 text-center text-red-500">
                            Failed to connect to chat server.{" "}
                            <button
                                onClick={handleReconnect}
                                className="underline hover:text-red-700"
                            >
                                Try again
                            </button>
                        </div>
                    )}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mb-2"></div>
                            Loading chats...
                        </div>
                    ) : filteredRooms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
                            {searchQuery ? "No matching chats found" : "No chat rooms available"}
                        </div>
                    ) : (
                        filteredRooms.map((room) => (
                            <div
                                key={room.id}
                                className={`flex items-center p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                                    selectedRoomId === room.id ? "bg-gray-100" : ""
                                }`}
                                onClick={() => handleRoomSelect(room.id)}
                            >
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                    <span className="text-green-600 font-medium">
                                        {(room.guestUser?.name || room.user?.name || "G").charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-medium text-gray-900 truncate">
                                            {room.guestUser?.name || room.user?.name || `Guest ${room.id}`}
                                            {room.unreadMessages > 0 && (
                                                <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                                    {room.unreadMessages}
                                                </span>
                                            )}
                                        </h3>
                                        {room.lastMessage?.createdAt && (
                                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                                {formatTime(room.lastMessage.createdAt)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-500 truncate max-w-[180px]">
                                            {room.lastMessage?.content || "No notes yet"}
                                        </p>
                                        <div className="flex items-center">
                                            {room.lastMessage?.read ? (
                                                <BsCheck2All size={16} className="text-blue-500" />
                                            ) : room.lastMessage ? (
                                                <BsCheck2All size={16} className="text-gray-400" />
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div
                className={`${
                    selectedRoomId ? "flex" : "hidden md:flex"
                } flex-1 flex-col bg-gray-50`}
            >
                {selectedRoomId && connectionStatus === "connected" ? (
                    <div className="flex flex-col h-full">
                        <div className="bg-gray-100 p-3 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                    <span className="text-green-600 font-medium">
                                        {chatRooms
                                                .find((r) => r.id === selectedRoomId)
                                                ?.guestUser?.name?.charAt(0)
                                                .toUpperCase() ||
                                            chatRooms
                                                .find((r) => r.id === selectedRoomId)
                                                ?.user?.name?.charAt(0)
                                                .toUpperCase() ||
                                            "G"}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-medium">
                                        {chatRooms.find((r) => r.id === selectedRoomId)?.guestUser?.name ||
                                            chatRooms.find((r) => r.id === selectedRoomId)?.user?.name ||
                                            `Guest ${selectedRoomId}`}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {chatRooms.find((r) => r.id === selectedRoomId)?.guestUser?.email || "Online"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3 text-gray-500">
                                <FiMoreVertical size={20} className="cursor-pointer" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5] bg-opacity-30">
                            <Chat
                                roomId={selectedRoomId}
                                currentUserId="admin"
                                messageAlignment="separate-sides"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-4">
                        {connectionStatus === "disconnected" ? (
                            <div className="text-center text-red-500">
                                <p>Failed to connect to chat server.</p>
                                <button
                                    onClick={handleReconnect}
                                    className="mt-2 bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700"
                                >
                                    Reconnect
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                                    <svg
                                        className="w-8 h-8 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                        ></path>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-medium text-gray-700 mb-2">Admin@Darubini</h3>
                                <p className="text-gray-500 text-center max-w-md">
                                    {connectionStatus === "connecting"
                                        ? "Connecting to chat server..."
                                        : "Select a chat to start messaging."}
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminChatWidget;