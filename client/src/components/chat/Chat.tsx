"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSendChatMessageMutation, useGetChatMessagesQuery, useMarkChatMessageReadMutation } from "@/state/api";
import { getSocket } from "@/lib/socket";
import { Socket } from "socket.io-client";
import { FiSend } from "react-icons/fi";
import { BsCheck2All, BsCheck2 } from "react-icons/bs";
import { IoMdRefresh } from "react-icons/io";
import { format } from "date-fns";

interface ChatMessage {
    id: number;
    roomId: number;
    content: string;
    senderId: string;
    senderType: "USER" | "ADMIN" | "GUEST";
    createdAt: string;
    read: boolean;
}

interface ChatProps {
    roomId: number;
    currentUserId: string;
    messageAlignment?: "left" | "right" | "separate-sides";
}

const Chat = ({
                  roomId,
                  currentUserId,
                  messageAlignment = "separate-sides"
              }: ChatProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const socketInitialized = useRef(false); // Track socket initialization

    const [sendChatMessage] = useSendChatMessageMutation();
    const [markChatMessageRead] = useMarkChatMessageReadMutation();
    const { data: initialMessages, isLoading, refetch } = useGetChatMessagesQuery({ roomId });

    // Auto-scroll to bottom when notes change
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    // Handle new notes and mark as read
    const handleNewMessage = useCallback((msg: ChatMessage) => {
        console.log(`Chat: New message received for room ${roomId}:`, msg);
        setMessages(prev => [...prev, msg]);
        if (msg.senderId !== currentUserId && !msg.read) {
            markChatMessageRead({ messageId: msg.id });
        }
    }, [currentUserId, markChatMessageRead, roomId]);

    // Initialize socket connection
    useEffect(() => {
        if (socketInitialized.current) {
            console.log(`Chat: Socket already initialized for room ${roomId}, skipping`);
            return;
        }
        socketInitialized.current = true;
        console.log(`Chat: Setting up socket for room ${roomId}`);

        let isMounted = true;

        const initializeSocket = async () => {
            try {
                const socketInstance = await getSocket();
                if (!isMounted) {
                    console.log(`Chat: Component unmounted, skipping socket setup for room ${roomId}`);
                    return;
                }

                console.log(`Chat: Socket instance retrieved for room ${roomId}:`, socketInstance.id);
                setSocket(socketInstance);

                // Check initial connection state
                if (socketInstance.connected) {
                    console.log(`Chat: Socket already connected for room ${roomId}`);
                    setIsConnected(true);
                    socketInstance.emit("chat:joinRoom", roomId);
                } else {
                    console.log(`Chat: Socket not connected, initiating connection for room ${roomId}`);
                    socketInstance.connect();
                }

                // Bind socket events
                socketInstance.on("connect", () => {
                    console.log(`Chat: Socket connect event for room ${roomId}`);
                    if (isMounted) {
                        setIsConnected(true);
                        socketInstance.emit("chat:joinRoom", roomId);
                    }
                });

                socketInstance.on("disconnect", () => {
                    console.log(`Chat: Socket disconnect event for room ${roomId}`);
                    if (isMounted) {
                        setIsConnected(false);
                    }
                });

                socketInstance.on("new-message", (msg: ChatMessage) => {
                    console.log(`Chat: Received new-message for room ${roomId}:`, msg);
                    if (isMounted) {
                        handleNewMessage(msg);
                    }
                });

                socketInstance.on("connect_error", (err) => {
                    console.error(`Chat: Socket connect_error for room ${roomId}:`, err.message);
                    if (isMounted) {
                        setIsConnected(false);
                        setError("Connection failed: " + err.message);
                    }
                });
            } catch (err) {
                console.error(`Chat: Socket initialization failed for room ${roomId}:`, err);
                if (isMounted) {
                    setError("Failed to connect to chat server.");
                    setIsConnected(false);
                }
            }
        };

        initializeSocket();

        return () => {
            isMounted = false;
            socketInitialized.current = false;
            if (socket) {
                console.log(`Chat: Cleaning up socket for room ${roomId}`);
                socket.emit("chat:leaveRoom", roomId);
                socket.off("connect");
                socket.off("disconnect");
                socket.off("new-message");
                socket.off("connect_error");
                if (socket.connected) {
                    socket.disconnect();
                }
            }
        };
    }, [roomId, handleNewMessage]);

    // Log isConnected state changes
    useEffect(() => {
        console.log(`Chat: isConnected state changed for room ${roomId}:`, isConnected);
    }, [isConnected, roomId]);

    // Load initial notes
    useEffect(() => {
        if (initialMessages && !isLoading) {
            console.log(`Chat: Initial messages loaded for room ${roomId}:`, initialMessages.data);
            setMessages(initialMessages.data);
        }
    }, [initialMessages, isLoading, roomId]);

    // Auto-scroll when notes change
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const sendMessage = async () => {
        const messageContent = input.trim();
        if (!messageContent || !isConnected || !socket) {
            console.log(`Chat: Cannot send message for room ${roomId}`, { messageContent, isConnected, socket: !!socket });
            return;
        }

        setIsSending(true);
        setError(null);

        try {
            const response = await sendChatMessage({ roomId, content: messageContent }).unwrap();
            console.log(`Chat: Message sent successfully for room ${roomId}:`, response);
            setInput("");
            inputRef.current?.focus();
        } catch (err: any) {
            console.error(`Chat: Send message error for room ${roomId}:`, err);
            setError(err.data?.message || "Failed to send message. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const refreshMessages = async () => {
        try {
            console.log(`Chat: Refetching messages for room ${roomId}`);
            await refetch();
            setError(null);
        } catch (err) {
            console.error(`Chat: Refresh messages error for room ${roomId}:`, err);
            setError("Failed to refresh notes");
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header with connection status */}
            <div className="flex items-center justify-between mb-4 p-2 border-b">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    Live Chat
                    <span
                        className={`flex items-center gap-1 text-sm ${
                            isConnected ? "text-green-600" : "text-red-500"
                        }`}
                        title={isConnected ? "Connected" : "Disconnected"}
                    >
                        <span
                            className={`h-2 w-2 rounded-full ${
                                isConnected ? "bg-green-600" : "bg-red-500"
                            }`}
                        />
                        {isConnected ? "Online" : "Offline"}
                    </span>
                </h2>
                <button
                    onClick={refreshMessages}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    title="Refresh messages"
                >
                    <IoMdRefresh size={18} />
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-100 text-red-700 p-2 mb-2 rounded text-sm flex justify-between items-center">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
                        ×
                    </button>
                </div>
            )}

            {/* Messages container */}
            <div className="flex-1 overflow-y-auto p-2 space-y-3 flex flex-col">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <div className="mb-2">No messages yet</div>
                        <div className="text-sm">Start the conversation!</div>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${
                                messageAlignment === "separate-sides"
                                    ? message.senderId === currentUserId
                                        ? "justify-end"
                                        : "justify-start"
                                    : `justify-${messageAlignment}`
                            }`}
                        >
                            <div
                                className={`max-w-[85%] rounded-lg p-3 ${
                                    message.senderId === currentUserId
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-200 text-gray-800"
                                }`}
                            >
                                <div className="text-xs font-medium mb-1">
                                    {message.senderId === currentUserId
                                        ? "You"
                                        : message.senderType === "ADMIN"
                                            ? "Darubini @Support"
                                            : "Guest User"}
                                </div>
                                <div>{message.content}</div>
                                <div className="flex items-center justify-end mt-1 gap-1">
                                    <span className="text-xs opacity-70">
                                        {format(new Date(message.createdAt), 'h:mm a')}
                                    </span>
                                    {message.senderId === currentUserId && (
                                        message.read ? (
                                            <BsCheck2All className="opacity-70 text-xs" />
                                        ) : (
                                            <BsCheck2 className="opacity-70 text-xs" />
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="mt-4 p-2 border-t">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-70"
                        disabled={!isConnected || isSending}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!isConnected || !input.trim() || isSending}
                        className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isSending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <FiSend size={18} />
                        )}
                    </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    {isConnected ? "Press Enter to send" : "Connecting to chat..."}
                </div>
            </div>
        </div>
    );
};

export default Chat;