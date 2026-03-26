"use client";
import React, { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import TextareaAutosize from "react-textarea-autosize";
import { motion, AnimatePresence } from "framer-motion";
import { StickyNoteInput } from "@/state";
import {
    X, Pin, PinOff, Palette, Type, RotateCcw, RotateCw,
    Clock, Sparkles, List, CheckSquare, Square, Check,
    ChevronRight
} from "lucide-react";

export type StickyFont = "handwriting" | "mono" | "serif" | "sans";

interface StickyNoteFormProps {
    initialData?: StickyNoteInput;
    onSubmit: (data: StickyNoteInput) => void;
    onClose: () => void;
}

// Color options with names and gradients (matching the card version)
const COLOR_OPTIONS = [
    { value: "#fef08a", name: "Lemon", emoji: "🍋" },
    { value: "#bbf7d0", name: "Mint", emoji: "🌿" },
    { value: "#fbcfe8", name: "Pink", emoji: "🌸" },
    { value: "#bfdbfe", name: "Sky", emoji: "☁️" },
    { value: "#ddd6fe", name: "Lavender", emoji: "🪻" },
    { value: "#fed7aa", name: "Peach", emoji: "🍑" },
    { value: "#dcfce7", name: "Emerald", emoji: "💎" },
    { value: "#fef3c7", name: "Amber", emoji: "🍯" },
    { value: "#f1f5f9", name: "Slate", emoji: "🪨" },
    { value: "#fecaca", name: "Rose", emoji: "🌹" },
    { value: "#ccfbf1", name: "Teal", emoji: "🦢" },
    { value: "#fef9c3", name: "Daisy", emoji: "🌼" },
];

interface ChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

export default function StickyNoteForm({ initialData, onSubmit, onClose }: StickyNoteFormProps) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [content, setContent] = useState(initialData?.content || "");
    const [color, setColor] = useState(initialData?.color || "#fef08a");
    const [isPinned, setIsPinned] = useState(initialData?.isPinned || false);
    const [font, setFont] = useState<StickyFont>(
        initialData?.font ?? "handwriting"
    );
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showFontPicker, setShowFontPicker] = useState(false);
    const [rotation, setRotation] = useState(initialData?.rotation || 0);
    const [reminderAt, setReminderAt] = useState(
        initialData?.reminderAt ? new Date(initialData.reminderAt).toISOString().slice(0, 16) : ""
    );
    const [mode, setMode] = useState<"text" | "checklist">("text");
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

    const formRef = useRef<HTMLDivElement>(null);
    const colorPickerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLTextAreaElement>(null);
    const checklistItemRef = useRef<(HTMLInputElement | null)[]>([]);

    // Initialize checklist from content if it contains bullet points
    useEffect(() => {
        if (initialData?.content) {
            const lines = initialData.content.split('\n');
            const checklistItems: ChecklistItem[] = [];
            let hasChecklist = false;

            lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
                    hasChecklist = true;
                    const isChecked = trimmed.startsWith('- [x]');
                    const text = trimmed.substring(5).trim();
                    if (text) {
                        checklistItems.push({
                            id: Math.random().toString(36).substr(2, 9),
                            text: text,
                            checked: isChecked
                        });
                    }
                }
            });

            if (hasChecklist && checklistItems.length > 0) {
                setMode("checklist");
                setChecklist(checklistItems);
                // Keep only non-checklist content
                const regularContent = lines.filter(line => {
                    const trimmed = line.trim();
                    return !trimmed.startsWith('- [ ]') && !trimmed.startsWith('- [x]');
                }).join('\n');
                setContent(regularContent);
            }
        }
    }, [initialData?.content]);

    // Auto-focus first checklist item when mode changes
    useEffect(() => {
        if (mode === "checklist" && checklist.length > 0) {
            const firstInput = checklistItemRef.current[0];
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }, [mode, checklist.length]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Check if click is outside both form AND color picker
            const target = event.target as Node;
            const isFormClick = formRef.current?.contains(target);
            const isColorPickerClick = colorPickerRef.current?.contains(target);

            // Only close if click is outside both form and color picker
            if (!isFormClick && !isColorPickerClick) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    // Separate effect to handle color picker closing
    useEffect(() => {
        function handleClickOutsideColorPicker(event: MouseEvent) {
            const target = event.target as Element;
            const isColorPickerClick = colorPickerRef.current?.contains(event.target as Node);
            const isColorTrigger = target.closest('[data-color-trigger]');
            const isColorPickerButton = target.closest('[data-color-picker-button]');

            // Close color picker only if clicking outside of it AND not on color trigger buttons
            if (!isColorPickerClick && !isColorTrigger && !isColorPickerButton) {
                setShowColorPicker(false);
            }
        }

        if (showColorPicker) {
            document.addEventListener("mousedown", handleClickOutsideColorPicker);
            return () => document.removeEventListener("mousedown", handleClickOutsideColorPicker);
        }
    }, [showColorPicker]);

    // Separate effect to handle font picker closing
    useEffect(() => {
        function handleClickOutsideFontPicker(event: MouseEvent) {
            const target = event.target as Element;
            const isFontButton = target.closest('[data-font-button]');

            if (!isFontButton) {
                setShowFontPicker(false);
            }
        }

        if (showFontPicker) {
            document.addEventListener("mousedown", handleClickOutsideFontPicker);
            return () => document.removeEventListener("mousedown", handleClickOutsideFontPicker);
        }
    }, [showFontPicker]);

    // Auto-focus content field on mount
    useEffect(() => {
        if (contentRef.current && !initialData?.content) {
            contentRef.current.focus();
        }
    }, [initialData?.content]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        if (mode === "checklist" && checklist.some(item => !item.text.trim())) {
            return; // Prevent submission with empty checklist items
        }

        let finalContent = content;
        if (mode === "checklist" && checklist.length > 0) {
            const checklistContent = checklist.map(item =>
                `- [${item.checked ? 'x' : ' '}] ${item.text}`
            ).join('\n');
            finalContent = content ? `${content}\n\n${checklistContent}` : checklistContent;
        }

        onSubmit({
            title,
            content: finalContent,
            color,
            isPinned,
            font,
            rotation,
            reminderAt: reminderAt ? new Date(reminderAt).toISOString() : null,
        });
    };

    const fontOptions: { id: StickyFont; name: string; icon: string }[] = [
        { id: "handwriting", name: "Handwriting", icon: "✍️" },
        { id: "mono", name: "Typewriter", icon: "⌨️" },
        { id: "serif", name: "Classic", icon: "📜" },
        { id: "sans", name: "Clean", icon: "🔄" },
    ];

    // Get current color info
    const currentColor = COLOR_OPTIONS.find(c => c.value === color) || { name: "Custom", emoji: "🎨" };

    // Handle color selection
    const handleColorSelect = (selectedColor: string) => {
        setColor(selectedColor);
        setShowColorPicker(false);
    };

    // Checklist functions
    const addChecklistItem = () => {
        const newItem: ChecklistItem = {
            id: Math.random().toString(36).substr(2, 9),
            text: "",
            checked: false
        };
        setChecklist([...checklist, newItem]);
        setTimeout(() => {
            const lastInput = checklistItemRef.current[checklist.length];
            if (lastInput) {
                lastInput.focus();
            }
        }, 10);
    };

    const updateChecklistItem = (id: string, text: string) => {
        setChecklist(checklist.map(item =>
            item.id === id ? { ...item, text } : item
        ));
    };

    const toggleChecklistItem = (id: string) => {
        setChecklist(checklist.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        ));
    };

    const removeChecklistItem = (id: string) => {
        setChecklist(checklist.filter(item => item.id !== id));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addChecklistItem();
        } else if (e.key === 'Backspace' && e.currentTarget.value === '' && index > 0) {
            e.preventDefault();
            removeChecklistItem(checklist[index].id);
            const prevInput = checklistItemRef.current[index - 1];
            if (prevInput) {
                prevInput.focus();
            }
        } else if (e.key === 'Tab' && !e.shiftKey && index === checklist.length - 1) {
            e.preventDefault();
            addChecklistItem();
        }
    };

    const toggleMode = () => {
        if (mode === "text") {
            setMode("checklist");
            if (checklist.length === 0) {
                addChecklistItem();
            }
        } else {
            setMode("text");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 overflow-y-auto py-8"
        >
            {/* Radial Color Picker Popover */}
            <AnimatePresence>
                {showColorPicker && (
                    <motion.div
                        ref={colorPickerRef}
                        initial={{ opacity: 0, scale: 0.8, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -20 }}
                        transition={{ type: "spring", damping: 20 }}
                        className="fixed bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 z-[60] max-w-[90vw] mx-4"
                        style={{
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            maxHeight: "80vh",
                            overflowY: "auto",
                        }}
                        onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to form
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Palette size={18} className="text-gray-600" />
                                <h3 className="font-bold text-gray-800">Pick a color vibe</h3>
                            </div>
                            <button
                                onClick={() => setShowColorPicker(false)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                data-color-picker-button
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Advanced Color Picker */}
                        <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Custom color</p>
                            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                <HexColorPicker
                                    color={color}
                                    onChange={setColor}
                                    className="!w-full max-w-[280px]"
                                />
                            </div>
                        </div>

                        {/* Current Selection */}
                        <div className="pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-lg border border-gray-300 shadow-sm"
                                        style={{ backgroundColor: color }}
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">
                                            {currentColor.emoji} {currentColor.name}
                                        </p>
                                        <p className="text-xs text-gray-500 font-mono">{color}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setColor("#fef08a");
                                        setShowColorPicker(false);
                                    }}
                                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    data-color-picker-button
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                ref={formRef}
                initial={{ scale: 0.9, y: 20, rotate: -2 }}
                animate={{ scale: 1, y: 0, rotate: 0 }}
                transition={{ type: "spring", damping: 25 }}
                style={{ backgroundColor: color, transform: `rotate(${rotation}deg)` }}
                className="relative z-50 w-[90vw] max-w-[420px] my-8 mx-4 rounded-2xl shadow-2xl border border-black/10"
                onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to backdrop
            >
                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden">
                    <div className="w-16 h-16 bg-black/5 -rotate-45 origin-top-left" />
                </div>

                <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Sparkles size={18} />
                            </div>
                            <h3 className={`text-lg sm:text-xl font-bold ${font === "handwriting" ? "font-[Caveat]" : "font-sans"}`}>
                                {initialData ? "Edit Note" : "New Note"}
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 hover:bg-black/10 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Title */}
                    <input
                        className={`w-full p-3 bg-white/30 rounded-lg border-none outline-none text-lg font-bold placeholder-black/40 backdrop-blur-sm ${
                            font === "handwriting" ? "font-[Caveat] text-xl sm:text-2xl" : ""
                        }`}
                        placeholder="What's on your mind?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                    />

                    {/* Content Mode Toggle */}
                    <div className="flex items-center justify-end">
                        <button
                            type="button"
                            onClick={toggleMode}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm ${
                                mode === "checklist"
                                    ? "bg-black/20 text-black"
                                    : "bg-white/50 hover:bg-white/80"
                            }`}
                        >
                            {mode === "checklist" ? <CheckSquare size={16} /> : <List size={16} />}
                            <span>{mode === "checklist" ? "Checklist" : "Add Checklist"}</span>
                        </button>
                    </div>

                    {/* Content Area */}
                    {mode === "text" ? (
                        <TextareaAutosize
                            ref={contentRef}
                            minRows={4}
                            maxRows={8}
                            className={`w-full p-3 bg-white/30 rounded-lg border-none outline-none resize-none placeholder-black/40 backdrop-blur-sm overflow-y-auto ${
                                font === "handwriting" ? "font-[Caveat] text-base sm:text-lg" : ""
                            }`}
                            placeholder="Let your thoughts flow... (Use - for bullet points)"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    ) : (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto p-1">
                            {checklist.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-center gap-2 group"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleChecklistItem(item.id)}
                                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                            item.checked
                                                ? "bg-black/30 border-black/30"
                                                : "bg-white/50 border-black/20 hover:bg-white/80"
                                        }`}
                                    >
                                        {item.checked && <Check size={12} />}
                                    </button>
                                    <input
                                        ref={(el) => {
                                            checklistItemRef.current[index] = el;
                                        }}
                                        type="text"
                                        value={item.text}
                                        onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                        placeholder={`Task ${index + 1}`}
                                        className={`flex-1 p-2 bg-white/30 rounded-lg border-none outline-none text-sm backdrop-blur-sm ${
                                            font === "handwriting" ? "font-[Caveat]" : ""
                                        } ${item.checked ? "line-through opacity-70" : ""}`}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => removeChecklistItem(item.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 rounded transition-all"
                                    >
                                        <X size={14} />
                                    </button>
                                </motion.div>
                            ))}
                            <button
                                type="button"
                                onClick={addChecklistItem}
                                className="w-full p-3 bg-white/30 hover:bg-white/50 rounded-lg border-2 border-dashed border-black/20 flex items-center justify-center gap-2 transition-all text-sm"
                            >
                                <span className="text-lg">+</span>
                                <span>Add new item</span>
                            </button>

                            {/* Progress indicator */}
                            {checklist.length > 0 && (
                                <div className="pt-2 mt-2 border-t border-black/10">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium">
                                            {checklist.filter(item => item.checked).length}/{checklist.length} completed
                                        </span>
                                        <span>
                                            {Math.round((checklist.filter(item => item.checked).length / checklist.length) * 100)}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-white/50 rounded-full overflow-hidden mt-1">
                                        <div
                                            className="h-full bg-black/30 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${(checklist.filter(item => item.checked).length / checklist.length) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Customization Tools */}
                    <div className="space-y-4 pt-4 border-t border-black/10">
                        {/* Top Row: Color, Font, Pin, Reminder in a compact straight line */}
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            {/* Left side: Compact icon buttons */}
                            <div className="flex items-center gap-1">
                                {/* Color Button */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        data-color-trigger
                                        onClick={() => setShowColorPicker(!showColorPicker)}
                                        className="group relative flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all hover:scale-105"
                                        style={{ backgroundColor: `${color}80` }}
                                        title="Change color"
                                    >
                                        <div className="relative">
                                            <div
                                                className="w-4 h-4 rounded-full border border-white/80 shadow-sm"
                                                style={{ backgroundColor: color }}
                                            />
                                            <Palette size={8} className="absolute -top-0.5 -right-0.5 text-white/90" />
                                        </div>
                                        <span className="text-xs font-medium text-black/70 hidden sm:inline">
                                      Color
                                    </span>
                                    </button>
                                </div>

                                {/* Divider */}
                                <div className="h-4 w-px bg-black/10" />

                                {/* Font Picker */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        data-font-button
                                        onClick={() => setShowFontPicker(!showFontPicker)}
                                        className="group flex items-center gap-1 px-2 py-1.5 bg-white/60 hover:bg-white/80 rounded-lg transition-all hover:scale-105"
                                        title="Change font"
                                    >
                                        <Type size={14} className="text-black/70" />
                                        <span className="text-xs font-medium text-black/70 hidden sm:inline">
                                              Font
                                            </span>
                                        <ChevronRight
                                            size={10}
                                            className={`text-black/40 transition-transform ${showFontPicker ? 'rotate-90' : ''}`}
                                        />
                                    </button>

                                    <AnimatePresence>
                                        {showFontPicker && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                                className="absolute top-full left-0 mt-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/30 p-2 z-20 min-w-[140px]"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {fontOptions.map((f) => (
                                                    <button
                                                        key={f.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setFont(f.id);
                                                            setShowFontPicker(false);
                                                        }}
                                                        className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm transition-colors ${
                                                            font === f.id
                                                                ? "bg-black/10 font-medium"
                                                                : "hover:bg-black/5"
                                                        }`}
                                                        data-font-button
                                                    >
                                                        <span className="text-base">{f.icon}</span>
                                                        <span className={`${f.id === "handwriting" ? "font-[Caveat]" : ""}`}>
                                                          {f.name}
                                                        </span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Divider */}
                                <div className="h-4 w-px bg-black/10" />

                                {/* Pin Toggle */}
                                <button
                                    type="button"
                                    onClick={() => setIsPinned(!isPinned)}
                                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all hover:scale-105 ${
                                        isPinned
                                            ? "bg-amber-100/80 text-amber-800"
                                            : "bg-white/60 hover:bg-white/80"
                                    }`}
                                    title={isPinned ? "Unpin note" : "Pin note"}
                                >
                                    {isPinned ? <Pin size={14} /> : <PinOff size={14} />}
                                    <span className="text-xs font-medium hidden sm:inline">
                                    {isPinned ? "Pinned" : "Pin"}
                                  </span>
                                </button>
                            </div>

                            {/* Right side: Compact Reminder */}
                            <div className="flex items-center gap-1">
                                <div className="relative group">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <Clock size={14} className="text-blue-600/70" />
                                        <div className="relative">
                                            <input
                                                type="datetime-local"
                                                value={reminderAt}
                                                onChange={(e) => setReminderAt(e.target.value)}
                                                className="text-xs bg-transparent border-none outline-none placeholder:text-gray-400 w-28 cursor-pointer"
                                                placeholder="Reminder"
                                            />
                                            {!reminderAt && (
                                                <div className="absolute inset-0 flex items-center pointer-events-none">
                                                    <span className="text-xs text-gray-400">Reminder</span>
                                                </div>
                                            )}
                                        </div>
                                    </label>

                                    {/* Clear reminder button */}
                                    {reminderAt && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            type="button"
                                            onClick={() => setReminderAt("")}
                                            className="absolute -right-5 top-1/2 -translate-y-1/2 p-1 bg-red-100/80 hover:bg-red-200/80 rounded-full transition-colors"
                                            title="Clear reminder"
                                        >
                                            <X size={10} className="text-red-600/70" />
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Reminder preview (if set) - moved outside to save space */}
                        {reminderAt && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="flex items-center justify-between px-2 py-1.5 bg-gradient-to-r from-blue-50/60 to-purple-50/60 rounded-lg text-xs"
                            >
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                    <span className="font-medium text-blue-700">
                                    ⏰ Reminder:
                                  </span>
                                                            </div>
                                                            <span className="font-semibold text-blue-800">
                                  {new Date(reminderAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                  })}
                                </span>
                            </motion.div>
                        )}

                        {/* Reminder preview (if set) */}
                        {reminderAt && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-50/60 to-purple-50/60 rounded-lg"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                    <span className="text-xs font-medium text-blue-700">
                                    ⏰ Reminder set for
                                  </span>
                                                            </div>
                                                            <span className="text-xs font-semibold text-blue-800">
                                  {new Date(reminderAt).toLocaleString([], {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                  })}
                                </span>
                            </motion.div>
                        )}

                        {/* Quick Color Presets */}
                        <div className="pt-3 border-t border-black/10">
                            <p className="text-sm font-medium mb-2 text-gray-700">Quick colors</p>
                            <div className="flex flex-wrap gap-2">
                                {COLOR_OPTIONS.slice(0, 6).map((col) => (
                                    <motion.button
                                        key={col.value}
                                        type="button"
                                        onClick={() => setColor(col.value)}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all ${
                                            color === col.value
                                                ? "border-black scale-110 shadow-md"
                                                : "border-white hover:scale-110"
                                        }`}
                                        style={{ backgroundColor: col.value }}
                                        title={col.name}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
                            <motion.button
                                type="button"
                                onClick={onClose}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-5 py-2.5 rounded-xl bg-black/5 hover:bg-black/10 font-medium transition-colors text-sm sm:text-base"
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                type="submit"
                                disabled={!title || (mode === "checklist" && checklist.some(item => !item.text.trim()))}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`px-5 py-2.5 rounded-xl font-medium transition-all text-sm sm:text-base ${
                                    !title || (mode === "checklist" && checklist.some(item => !item.text.trim()))
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-black text-white hover:bg-black/80 shadow-lg"
                                }`}
                            >
                                {initialData ? "Update Note ✨" : "Create Magic 🪄"}
                            </motion.button>
                        </div>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}