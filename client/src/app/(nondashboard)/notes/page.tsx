"use client";

import React, { useState } from "react";
import {
    useGetStickyNotesQuery,
    useCreateStickyNoteMutation, StickyNoteInput, StickyNoteCreateInput,
} from "@/state";
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    rectIntersection,
} from "@dnd-kit/core";
import StickyNoteCard from "./StickyNoteCard";
import StickyNoteForm from "./StickyNoteForm";
import toast, { Toaster } from "react-hot-toast";
import { Plus, Zap, Search } from "lucide-react";

export default function StickyNotesContainer() {
    const { data: notes, isLoading, isError } = useGetStickyNotesQuery();
    const [createStickyNote] = useCreateStickyNoteMutation();

    const [showForm, setShowForm] = useState(false);
    const [editingNote, setEditingNote] = useState<StickyNoteInput | null>(null);
    const [search, setSearch] = useState("");
    const [activeId, setActiveId] = useState<string | null>(null);

    const filteredNotes =
        notes?.filter(
            (note) =>
                note.title.toLowerCase().includes(search.toLowerCase()) ||
                note.content.toLowerCase().includes(search.toLowerCase())
        ) || [];

    // Sort notes: pinned first, then by updated date
    const sortedNotes = [...filteredNotes].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    // Arrange notes in overlapping style like the cards in your image
    const getNoteStyle = (index: number, isPinned: boolean) => {
        const baseLeft = 40;
        const baseTop = 40;
        const overlap = 25;
        const maxNotesPerRow = 7;


        const row = Math.floor(index / maxNotesPerRow);
        const col = index % maxNotesPerRow;

        if (isPinned) {
            return {
                left: 20 + col * 220,
                top: 20,
                zIndex: 100 + col,
                transform: `rotate(${(col % 3) * 2 - 2}deg)`,
            };
        }

        // Regular notes in overlapping layout
        return {
            left: baseLeft + col * (200 - overlap),
            top: baseTop + row * (180 - overlap),
            zIndex: 10 + index,
            transform: `rotate(${((index % 5) - 2) * 1.5}deg)`,
        };
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (_event: DragEndEvent) => {
        setActiveId(null);
    };

    const handleQuickNote = async () => {
        const quickNotes: StickyNoteCreateInput[] = [
            {
                title: "Shopping List",
                content: "• Milk\n• Eggs\n• Bread\n• Coffee",
                color: "#bbf7d0",
                font: "handwriting",
                rotation: -1,
                width: 200,
                height: 200,
            },
            {
                title: "Meeting Notes",
                content: "Discuss project timeline\nReview budget\nAssign tasks",
                color: "#bfdbfe",
                font: "mono",
                rotation: 2,
                width: 200,
                height: 200,
            },
            {
                title: "Ideas",
                content: "✨ New feature ideas\n💡 Improvements\n🚀 Next steps",
                color: "#fbcfe8",
                font: "handwriting",
                rotation: -2,
                width: 200,
                height: 200,
            },
            {
                title: "Bridge Game",
                content: "5K-5A\n3K-4\n8K-10\n2K-6",
                color: "#fef08a",
                font: "mono",
                rotation: 1,
                width: 250,
                height: 250,
            },
        ];

        const randomNote = quickNotes[Math.floor(Math.random() * quickNotes.length)];
        await createStickyNote(randomNote);
        toast.success("Quick note added!");
    };

    return (
        <div className="p-6 w-full h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            Sticky Notes
                        </h1>
                        <p className="text-gray-600">
                            Your digital brainstorming space
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search notes..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                            />
                        </div>

                        <button
                            onClick={handleQuickNote}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                        >
                            <Zap size={16} />
                            Quick Note
                        </button>

                        <button
                            onClick={() => {
                                setEditingNote(null);
                                setShowForm(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus size={16} />
                            Add Note
                        </button>
                    </div>
                </div>
            </div>

            {/* Notes Container */}
            <div className="relative w-full h-[calc(100vh-180px)] overflow-auto">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-600">
                                Loading your notes...
                            </p>
                        </div>
                    </div>
                )}

                {isError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                            <p className="text-red-500 text-lg mb-2">
                                Failed to load notes
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                <DndContext
                    collisionDetection={rectIntersection}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="relative w-full h-full min-h-[600px]">
                        {/* Pinned Notes Section */}
                        {sortedNotes.filter(note => note.isPinned).length > 0 && (
                            <div className="mb-8">
                                <div className="relative min-h-[240px]">
                                    {sortedNotes
                                        .filter(note => note.isPinned)
                                        .map((note, index) => {
                                            const style = getNoteStyle(index, true);
                                            return (
                                                <div
                                                    key={note.id}
                                                    className="absolute"
                                                    style={{
                                                        left: style.left,
                                                        top: style.top,
                                                        zIndex: style.zIndex,
                                                    }}
                                                >
                                                    <StickyNoteCard
                                                        note={note}
                                                        stackIndex={index}
                                                        total={sortedNotes.length}
                                                        setEditingNote={setEditingNote}
                                                        setShowForm={setShowForm}
                                                    />
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        <div className="relative min-h-[600px]">
                            {sortedNotes
                                .filter(note => !note.isPinned)
                                .map((note, index) => {
                                    const style = getNoteStyle(index, false);
                                    return (
                                        <div
                                            key={note.id}
                                            className="absolute transition-all duration-300 ease-in-out hover:z-50"
                                            style={{
                                                left: `${style.left}px`,
                                                top: `${style.top}px`,
                                                zIndex: style.zIndex,
                                            }}
                                        >
                                            <StickyNoteCard
                                                note={note}
                                                stackIndex={index}
                                                total={sortedNotes.length}
                                                setEditingNote={setEditingNote}
                                                setShowForm={setShowForm}
                                            />
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </DndContext>

                {/* Empty State */}
                {!isLoading && sortedNotes.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                        <div className="text-6xl mb-4 animate-bounce">📝</div>
                        <p className="text-xl mb-2">No notes yet</p>
                        <p className="text-gray-500 mb-6">
                            Create your first sticky note!
                        </p>
                        <button
                            onClick={() => {
                                setEditingNote(null);
                                setShowForm(true);
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all hover:scale-105"
                        >
                            Create Your First Note
                        </button>
                    </div>
                )}

                {/* Background Pattern */}
                <div className="absolute inset-0 pointer-events-none opacity-5">
                    <div className="grid grid-cols-8 grid-rows-6 h-full">
                        {Array.from({ length: 48 }).map((_, i) => (
                            <div key={i} className="border border-gray-300"></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <StickyNoteForm
                            initialData={editingNote || undefined}
                            onClose={() => setShowForm(false)}
                            onSubmit={async (data) => {
                                if (editingNote) {
                                    toast.success("Note updated!");
                                } else {
                                    await createStickyNote(data);
                                    toast.success("Note created!");
                                }
                                setShowForm(false);
                                setEditingNote(null);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}