"use client";

import React, { useState, useRef, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { StickyNote } from "@/types/prismaTypes";
import { useUpdateStickyNoteMutation, useDeleteStickyNoteMutation } from "@/state";
import { motion, AnimatePresence } from "framer-motion";
import {
    Pin, PinOff, Trash2, Edit2, Maximize2, Minimize2,
    StickyNote as NoteIcon,
    CornerUpLeft,
    Palette,
    X,
    Check,
    CheckSquare,
    Square,
    List
} from "lucide-react";
import useSound from "use-sound";
import { toast } from "sonner";

interface Props {
    note: StickyNote;
    stackIndex: number;
    total: number;
    setEditingNote: (note: StickyNote) => void;
    setShowForm: (v: boolean) => void;
}

// Color options with names and gradients
const COLOR_OPTIONS = [
    { value: "#fef08a", name: "Lemon", gradient: "from-yellow-100 to-yellow-200" },
    { value: "#bbf7d0", name: "Mint", gradient: "from-green-100 to-green-200" },
    { value: "#fbcfe8", name: "Pink", gradient: "from-pink-100 to-pink-200" },
    { value: "#bfdbfe", name: "Sky", gradient: "from-blue-100 to-blue-200" },
    { value: "#ddd6fe", name: "Lavender", gradient: "from-purple-100 to-purple-200" },
    { value: "#fed7aa", name: "Peach", gradient: "from-orange-100 to-orange-200" },
    { value: "#dcfce7", name: "Emerald", gradient: "from-emerald-100 to-emerald-200" },
    { value: "#fef3c7", name: "Amber", gradient: "from-amber-100 to-amber-200" },
    { value: "#f1f5f9", name: "Slate", gradient: "from-slate-100 to-slate-200" },
    { value: "#fecaca", name: "Rose", gradient: "from-rose-100 to-rose-200" },
    { value: "#ccfbf1", name: "Teal", gradient: "from-teal-100 to-teal-200" },
    { value: "#fef9c3", name: "Daisy", gradient: "from-yellow-50 to-yellow-100" },
];

interface ChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

export default function StickyNoteCard({ note, setEditingNote, setShowForm }: Props) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: note.id,
    });

    const [updateStickyNote] = useUpdateStickyNoteMutation();
    const [deleteStickyNote] = useDeleteStickyNoteMutation();
    const [isStashed, setIsStashed] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
    const [hasChecklist, setHasChecklist] = useState(false);
    const noteRef = useRef<HTMLDivElement>(null);
    const colorPickerRef = useRef<HTMLDivElement>(null);

    const [playSticky] = useSound("/sounds/sticky.mp3");
    const [playFlip] = useSound("/sounds/flip.mp3");
    const [playReminder] = useSound("/sounds/pop.mp3");
    const [playColorChange] = useSound("/sounds/pop.mp3", { volume: 0.5 });
    const [playCheck] = useSound("/sounds/click.mp3", { volume: 0.3 });

    useEffect(() => {
        if (note.content) {
            const lines = note.content.split('\n');
            const items: ChecklistItem[] = [];
            let hasChecklistMarkers = false;

            lines.forEach((line: string, index: number) => {
                const trimmed = line.trim();

                if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
                    hasChecklistMarkers = true;

                    const isChecked = trimmed.startsWith('- [x]');
                    const itemText = trimmed.substring(5).trim();

                    items.push({
                        id: `${note.id}-${index}`,
                        text: itemText,
                        checked: isChecked,
                    });
                }
            });

            setHasChecklist(hasChecklistMarkers);
            setChecklistItems(items);
        }
    }, [note.content, note.id]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                colorPickerRef.current &&
                !colorPickerRef.current.contains(event.target as Node) &&
                !(event.target as Element).closest('[data-color-button]')
            ) {
                setShowColorPicker(false);
            }
        }

        if (showColorPicker) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [showColorPicker]);

    // Reminder effect
    useEffect(() => {
        if (!note.reminderAt) return;

        const reminderTime = new Date(note.reminderAt).getTime();
        let played = false;

        const interval = setInterval(() => {
            const now = Date.now();
            if (!played && now >= reminderTime) {
                playReminder();
                played = true;
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [note.reminderAt, playReminder]);

    // Flip note
    const handleDoubleClick = () => {
        setIsFlipped(!isFlipped);
        if (playFlip) playFlip();
    };

    const handleFlip = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFlipped(!isFlipped);
        if (playFlip) playFlip();
    };

    // Expand note
    const handleExpand = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const newIsExpanded = !isExpanded;
        setIsExpanded(newIsExpanded);

        const newSize = {
            width: newIsExpanded ? 400 : 200,
            height: newIsExpanded ? 400 : 200,
        };

        try {
            await updateStickyNote({
                id: note.id,
                data: { width: newSize.width, height: newSize.height }
            }).unwrap();
        } catch (error) {
            console.error("Failed to update note size:", error);
            setIsExpanded(!newIsExpanded);
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingNote(note);
        setShowForm(true);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        toast("Delete this note?", {
            description: "This action cannot be undone… or can it? 😏",
            action: {
                label: "Yes, delete",
                onClick: async () => {
                    const promise = deleteStickyNote(note.id).unwrap();
                    toast.promise(promise, {
                        loading: "Deleting note...",
                        success: "Note deleted successfully 🗑️",
                        error: "Failed to delete note 😕",
                    });
                    await promise;
                }
            },
            cancel: { label: "Cancel", onClick: () => toast.dismiss() },
            duration: 6000,
        });
    };

    const handlePinToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await updateStickyNote({ id: note.id, data: { isPinned: !note.isPinned } }).unwrap();
        } catch (error) {
            console.error("Failed to toggle pin:", error);
        }
    };

    const handleColorChange = async (color: string, e: React.MouseEvent) => {
        e.stopPropagation();
        playColorChange();
        try {
            await updateStickyNote({ id: note.id, data: { color } }).unwrap();
            setShowColorPicker(false);
        } catch (error) {
            console.error("Failed to update color:", error);
        }
    };

    const handleStash = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsStashed(true);
    };

    type FontType = 'handwriting' | 'mono' | 'serif' | 'sans';
    const isValidFont = (font: string): font is FontType =>
        ['handwriting', 'mono', 'serif', 'sans'].includes(font);

    const fontClass = {
        handwriting: "font-[Caveat]",
        mono: "font-mono",
        serif: "font-serif",
        sans: "font-sans"
    }[isValidFont(note.font || "") ? (note.font as FontType) : "handwriting"];

    const handleButtonMouseDown = (e: React.MouseEvent) => e.stopPropagation();

    const toggleColorPicker = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowColorPicker(!showColorPicker);
    };

    // Toggle checklist item status
    const toggleChecklistItem = async (id: string) => {
        playCheck();

        const updatedItems = checklistItems.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        );

        // Update local state immediately for instant feedback
        setChecklistItems(updatedItems);

        try {
            // Reconstruct the content with updated checkboxes
            const otherContent = note.content
                .split('\n')
                .filter((line: string) =>
                    !line.trim().startsWith('- [ ]') &&
                    !line.trim().startsWith('- [x]')
                )
                .join('\n');

            const checklistContent = updatedItems
                .map(item => `- [${item.checked ? 'x' : ' '}] ${item.text}`)
                .join('\n');

            const newContent =
                otherContent +
                (otherContent && checklistContent ? '\n\n' : '') +
                checklistContent;

            await updateStickyNote({
                id: note.id,
                data: { content: newContent },
            }).unwrap();
        } catch (error) {
            console.error('Failed to update checklist:', error);
            // Revert local state on error
            setChecklistItems(checklistItems);
        }
    };

    // Get position for color picker (top-right corner of the note)
    const getColorPickerPosition = () => {
        if (!noteRef.current) return { top: 0, right: 0 };

        const rect = noteRef.current.getBoundingClientRect();
        return {
            top: rect.top + window.scrollY - 20,
            right: window.innerWidth - rect.right - 20,
        };
    };

    // Render content with or without checklist
    const renderContent = () => {
        if (hasChecklist && checklistItems.length > 0) {
            const completedCount = checklistItems.filter(item => item.checked).length;
            const totalCount = checklistItems.length;
            const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

            return (
                <div className="flex-1 overflow-auto">
                    {/* Progress bar */}
                    <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium opacity-75">Progress</span>
                            <span className="text-xs font-medium">
                {completedCount}/{totalCount}
              </span>
                        </div>
                        <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-green-500/60 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercentage}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                        </div>
                    </div>

                    {/* Checklist items */}
                    <div className="space-y-1.5">
                        {checklistItems.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-start gap-2 group"
                            >
                                <button
                                    onClick={() => toggleChecklistItem(item.id)}
                                    className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                        item.checked
                                            ? "bg-green-500/30 border-green-500/50"
                                            : "bg-white/50 border-black/20 hover:bg-white/80"
                                    }`}
                                >
                                    {item.checked && <Check size={10} />}
                                </button>
                                <span
                                    className={`text-sm flex-1 leading-tight cursor-pointer select-none ${
                                        item.checked ? "line-through opacity-60" : ""
                                    }`}
                                    onClick={() => toggleChecklistItem(item.id)}
                                >
                  {item.text || "Empty item"}
                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            );
        } else {
            const lines = note.content?.split('\n') || [];
            return (
                <div className="flex-1 overflow-auto leading-relaxed">
                    {lines.map((line: string, index: number) => {
                        const trimmed = line.trim();

                        // Handle regular bullet points
                        if (
                            trimmed.startsWith('- ') &&
                            !trimmed.startsWith('- [ ]') &&
                            !trimmed.startsWith('- [x]')
                        ) {
                            return (
                                <div key={index} className="flex items-start gap-2">
                                    <span className="text-lg">•</span>
                                    <span>{trimmed.substring(2)}</span>
                                </div>
                            );
                        }

                        if (/^\d+\.\s/.test(trimmed)) {
                            return (
                                <div key={index} className="flex items-start gap-2">
          <span className="font-medium">
            {trimmed.match(/^\d+/)?.[0]}.
          </span>
                                    <span>{trimmed.replace(/^\d+\.\s*/, '')}</span>
                                </div>
                            );
                        }

                        return <div key={index}>{line}</div>;
                    })}
                </div>

            );
        }
    };

    return (
        <AnimatePresence>
            {!isStashed ? (
                <>
                    <AnimatePresence>
                        {showColorPicker && (
                            <motion.div
                                ref={colorPickerRef}
                                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                                transition={{ type: "spring", damping: 20 }}
                                className="fixed z-[100] bg-white rounded-2xl shadow-2xl border border-gray-200 p-6"
                                style={getColorPickerPosition()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Palette size={18} className="text-gray-600" />
                                        <h3 className="font-bold text-gray-800">Pick a color</h3>
                                    </div>
                                    <button
                                        onClick={() => setShowColorPicker(false)}
                                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Radial Color Wheel */}
                                <div className="relative w-64 h-64 mb-4">
                                    {COLOR_OPTIONS.map((color, index) => {
                                        const angle = (index * 360) / COLOR_OPTIONS.length;
                                        const radius = 80;
                                        const x = radius * Math.cos((angle * Math.PI) / 180);
                                        const y = radius * Math.sin((angle * Math.PI) / 180);

                                        return (
                                            <motion.button
                                                key={color.value}
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{
                                                    scale: 1,
                                                    opacity: 1,
                                                    x: x,
                                                    y: y
                                                }}
                                                transition={{
                                                    delay: index * 0.02,
                                                    type: "spring",
                                                    stiffness: 200
                                                }}
                                                onClick={(e) => handleColorChange(color.value, e)}
                                                className={`absolute left-1/2 top-1/2 w-12 h-12 rounded-full border-4 border-white shadow-lg hover:shadow-xl transition-all duration-200 ${
                                                    note.color === color.value
                                                        ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                                                        : ''
                                                }`}
                                                style={{
                                                    backgroundColor: color.value,
                                                    transform: `translate(${x}px, ${y}px)`,
                                                    marginLeft: '-24px',
                                                    marginTop: '-24px'
                                                }}
                                                title={color.name}
                                                whileHover={{ scale: 1.15, rotate: 5 }}
                                                whileTap={{ scale: 0.95 }}
                                            />
                                        );
                                    })}

                                    {/* Center Preview */}
                                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                        <div
                                            className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                                            style={{ backgroundColor: note.color }}
                                        />
                                    </div>
                                </div>

                                {/* Color Grid for quick selection */}
                                <div className="grid grid-cols-6 gap-2">
                                    {COLOR_OPTIONS.slice(0, 6).map((color) => (
                                        <button
                                            key={color.value}
                                            onClick={(e) => handleColorChange(color.value, e)}
                                            className={`h-8 rounded-lg transition-all ${
                                                note.color === color.value
                                                    ? 'ring-2 ring-offset-1 ring-gray-400 scale-105'
                                                    : ''
                                            }`}
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>

                                {/* Current Color Info */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-lg border border-gray-300"
                                            style={{ backgroundColor: note.color }}
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">
                                                Current: {COLOR_OPTIONS.find(c => c.value === note.color)?.name || 'Custom'}
                                            </p>
                                            <p className="text-xs text-gray-500">{note.color}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Sticky Note Card */}
                    <motion.div
                        ref={setNodeRef}
                        style={{
                            width: isExpanded ? 400 : (note.width || 200),
                            height: isExpanded ? 400 : (note.height || 200),
                            transform: CSS.Translate.toString(transform),
                            backgroundColor: note.color || "#fef08a",
                            rotate: note.rotation || 0,
                        }}
                        {...attributes}
                        drag
                        dragElastic={0.1}
                        dragConstraints={{ left: 0, top: 0, right: window.innerWidth - 200, bottom: window.innerHeight - 200 }}
                        onDragStart={() => playSticky && playSticky()}
                        initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                        animate={{ opacity: 1, scale: 1, rotate: note.rotation || 0 }}
                        exit={{ opacity: 0, scale: 0.5, rotate: -90 }}
                        whileHover={{ scale: 1.02, zIndex: 50 }}
                        whileTap={{ scale: 0.98 }}
                        onMouseEnter={() => setShowControls(true)}
                        onMouseLeave={() => setShowControls(false)}
                        onDoubleClick={handleDoubleClick} // <-- only flip on double click now
                        className="absolute p-4 rounded-lg shadow-xl cursor-move flex flex-col select-none border border-black/10"
                    >
                    {/* Front side */}
                        <AnimatePresence mode="wait">
                            {!isFlipped ? (
                                <motion.div
                                    key="front"
                                    initial={{ rotateY: 90 }}
                                    animate={{ rotateY: 0 }}
                                    exit={{ rotateY: -90 }}
                                    className="h-full flex flex-col"
                                    ref={noteRef}
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5">
                                                {hasChecklist ? (
                                                    <CheckSquare size={14} className="opacity-60" />
                                                ) : (
                                                    <NoteIcon size={14} className="opacity-60" />
                                                )}
                                                <h4 className={`font-bold text-lg truncate ${fontClass}`}>
                                                    {note.title}
                                                </h4>
                                            </div>

                                            {/* Checklist indicator badge */}
                                            {hasChecklist && (
                                                <span className="text-xs bg-black/10 px-1.5 py-0.5 rounded-full">
                          ✓{checklistItems.filter(item => item.checked).length}/{checklistItems.length}
                        </span>
                                            )}
                                        </div>

                                        <AnimatePresence>
                                            {showControls && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="flex gap-1 bg-white/80 backdrop-blur-sm rounded-lg p-1"
                                                    onMouseDown={handleButtonMouseDown}
                                                >
                                                    <button onClick={handleFlip} className="p-1 hover:bg-black/10 rounded" title="Flip note">
                                                        <CornerUpLeft size={14} />
                                                    </button>
                                                    <button onClick={handleStash} className="p-1 hover:bg-black/10 rounded" title="Stash">
                                                        📥
                                                    </button>
                                                    <button onClick={handleEdit} className="p-1 hover:bg-black/10 rounded" title="Edit">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={handlePinToggle} className="p-1 hover:bg-black/10 rounded" title={note.isPinned ? "Unpin" : "Pin"}>
                                                        {note.isPinned ? <Pin size={14} /> : <PinOff size={14} />}
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Content area */}
                                    <div className={`flex-1 overflow-auto ${fontClass}`}>
                                        {renderContent()}

                                        {/* Reminder display */}
                                        {note.reminderAt && (
                                            <div className="mt-3 pt-3 border-t border-black/10 text-xs text-red-600 font-medium flex items-center gap-1">
                                                ⏰ {new Date(note.reminderAt).toLocaleString()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-black/10 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            {/* Enhanced Color Button */}
                                            <button
                                                data-color-button
                                                onClick={toggleColorPicker}
                                                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-white/50 hover:bg-white/80 transition-all duration-200 group"
                                                onMouseDown={handleButtonMouseDown}
                                            >
                                                <div className="relative">
                                                    <div
                                                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                                                        style={{ backgroundColor: note.color }}
                                                    />
                                                    <Palette size={12} className="absolute -top-1 -right-1 text-gray-600" />
                                                </div>
                                                <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                          Change
                        </span>
                                            </button>

                                            {/* Quick Color Swatches */}
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                {COLOR_OPTIONS.slice(0, 3).map((c) => (
                                                    <button
                                                        key={c.value}
                                                        onClick={(e) => handleColorChange(c.value, e)}
                                                        className={`w-4 h-4 rounded-full border-2 transition-transform hover:scale-125 ${
                                                            note.color === c.value
                                                                ? "border-black scale-110"
                                                                : "border-white"
                                                        }`}
                                                        style={{ backgroundColor: c.value }}
                                                        title={c.name}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-1">
                                            <button onClick={handleExpand} className="p-1 hover:bg-black/10 rounded" title={isExpanded ? "Shrink" : "Expand"}>
                                                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                                            </button>
                                            <button onClick={handleDelete} className="p-1 hover:bg-red-500 hover:text-white rounded transition-colors" title="Delete">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="back"
                                    initial={{ rotateY: -90 }}
                                    animate={{ rotateY: 0 }}
                                    exit={{ rotateY: 90 }}
                                    className="h-full flex flex-col items-center justify-center bg-black/5 rounded-lg p-4"
                                    onClick={handleFlip}
                                >
                                    <div className="text-center">
                                        {hasChecklist ? (
                                            <>
                                                <CheckSquare size={32} className="mx-auto mb-3 opacity-40" />
                                                <p className="text-sm opacity-75 mb-2">Checklist progress</p>
                                                <p className="font-bold text-xl">
                                                    {checklistItems.filter(item => item.checked).length}/{checklistItems.length}
                                                </p>
                                                {checklistItems.length > 0 && (
                                                    <p className="text-xs mt-2 opacity-60">
                                                        {Math.round((checklistItems.filter(item => item.checked).length / checklistItems.length) * 100)}% complete
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <NoteIcon size={32} className="mx-auto mb-3 opacity-40" />
                                                <p className="text-sm opacity-75 mb-2">Created on</p>
                                                <p className="font-bold">{new Date(note.createdAt).toLocaleDateString()}</p>
                                            </>
                                        )}
                                        <p className="text-xs mt-4 opacity-60">Click to flip back</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Fold effect */}
                        <div className="absolute top-0 right-0 w-6 h-6 overflow-hidden">
                            <div className="w-12 h-12 bg-black/5 -rotate-45 origin-top-left" />
                        </div>
                    </motion.div>
                </>
            ) : (
                <motion.div
                    className="absolute bottom-4 left-4 px-3 py-2 rounded-lg bg-gradient-to-r from-gray-300 to-gray-200 cursor-pointer shadow-lg border"
                    onClick={() => setIsStashed(false)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    whileHover={{ scale: 1.05 }}
                >
                    <div className="flex items-center gap-2">
                        {hasChecklist ? (
                            <CheckSquare size={14} />
                        ) : (
                            <NoteIcon size={14} />
                        )}
                        <span className="text-sm font-medium">
              {note.title.length > 12 ? note.title.slice(0, 12) + "…" : note.title}
            </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}