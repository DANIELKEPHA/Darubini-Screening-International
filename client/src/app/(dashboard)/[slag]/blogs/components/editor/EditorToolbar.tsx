'use client';

import * as React from 'react';
import {EditorContent, useEditor} from '@tiptap/react'
import { Extension, RawCommands, ChainedCommands } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {TextStyle} from '@tiptap/extension-text-style';
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import css from 'highlight.js/lib/languages/css';
import html from 'highlight.js/lib/languages/xml';
import { Button } from '@/components/ui/button';
import { UseFormSetValue } from 'react-hook-form';
import { toast } from 'sonner';
import { Loader2, Bold, Italic, Heading, List, Link as LinkIcon, Image as ImageIcon, Code, Table as TableIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo, Redo } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import sanitizeHtml from 'sanitize-html';
import {BlogFormData} from "@/lib/schemas";

// Create lowlight instance and register languages
const lowlight = createLowlight();
lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);
lowlight.register('css', css);
lowlight.register('html', html);

const FontColor = Extension.create<{
    types: string[]
    colors: string[]
}>({
    name: 'fontColor',
    addOptions() {
        return {
            types: ['textStyle'],
            colors: [
                '#000000', // black
                '#FF0000', // red
                '#00FF00', // green
                '#0000FF', // blue
                '#FF00FF', // magenta
                '#00FFFF', // cyan
                '#FFA500', // orange
            ],
        }
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    color: {
                        default: null,
                        parseHTML: element => element.style.color,
                        renderHTML: attributes => {
                            if (!attributes.color) return {}
                            return { style: `color: ${attributes.color}` }
                        },
                    },
                },
            },
        ]
    },
    addCommands() {
        return {
            setFontColor:
                (color: string) =>
                    ({ chain }: { chain: () => ChainedCommands }) =>
                        chain().setMark('textStyle', { color }).run(),
            unsetFontColor:
                () =>
                    ({ chain }: { chain: () => ChainedCommands }) =>
                        chain().setMark('textStyle', { color: null }).run(),
        } satisfies Partial<RawCommands>
    },
})

const FontSize = Extension.create<{
    types: string[]
    sizes: string[]
}>({
    name: 'fontSize',
    addOptions() {
        return {
            types: ['textStyle'],
            sizes: ['12px', '14px', '16px', '18px', '20px', '24px', '30px'],
        }
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize,
                        renderHTML: attributes => {
                            if (!attributes.fontSize) return {}
                            return { style: `font-size: ${attributes.fontSize}` }
                        },
                    },
                },
            },
        ]
    },
    addCommands() {
        return {
            setFontSize:
                (size: string) =>
                    ({ chain }) =>
                        chain().setMark('textStyle', { fontSize: size }).run(),
            unsetFontSize:
                () =>
                    ({ chain }) =>
                        chain().setMark('textStyle', { fontSize: null }).run(),
        } satisfies Partial<RawCommands>
    },
})

const defaultExtensions = [
    StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
    }),
    Link.configure({
        openOnClick: false,
        autolink: true,
    }),
    Image.configure({
        inline: true,
        allowBase64: false,
    }),
    CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'javascript',
    }),
    Table.configure({
        resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    TextAlign.configure({
        types: ['heading', 'paragraph'],
    }),
    Placeholder.configure({
        placeholder: 'Write your blog content here...',
    }),
    TextStyle,
    FontColor,
    FontSize,
];

interface EditorToolbarProps {
    content: string;
    setValue: UseFormSetValue<BlogFormData>;
    error?: { message?: string };
    disabled?: boolean;
    maxLength?: number;
    customExtensions?: any[];
}

const EditorToolbar: React.FC<EditorToolbarProps> = React.memo(
    ({ content, setValue, error, disabled, maxLength = 10000, customExtensions = [] }) => {
        const [isUploading, setIsUploading] = React.useState(false);

        const editor = useEditor({
            extensions: [...defaultExtensions, ...customExtensions],
            content,
            onUpdate: ({ editor }) => {
                const html = editor.getHTML();
                if (maxLength && html.length > maxLength) {
                    toast.error(`Content exceeds maximum length of ${maxLength} characters`);
                    editor.commands.setContent(content);
                    return;
                }
                const cleanHtml = sanitizeHtml(html, {
                    allowedTags: ['p', 'b', 'i', 'h1', 'h2', 'ul', 'li', 'a', 'img', 'pre', 'code', 'table', 'tr', 'td', 'th', 'span'],
                    allowedAttributes: {
                        a: ['href'],
                        img: ['src'],
                        code: ['class'],
                        span: ['style'],
                    },
                    allowedStyles: {
                        span: {
                            color: [/^#[0-9A-Fa-f]{6}$/],
                            'font-size': [/^\d+(?:px|em|rem)$/],
                        },
                    },
                });
                setValue('content', cleanHtml, { shouldValidate: true });
            },
            editable: !disabled,
            immediatelyRender: false,
        });

        React.useEffect(() => {
            if (editor && content && editor.getHTML() !== content) {
                editor.commands.setContent(content);
            }
        }, [editor, content]);

        const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
            if (!editor || disabled) return;
            const file = event.target.files?.[0];
            if (!file) return;

            const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                toast.error('Invalid file type. Please upload JPEG, PNG, or WebP.');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File too large. Maximum size is 5MB.');
                return;
            }

            setIsUploading(true);
            try {
                const formData = new FormData();
                formData.append('image', file);
                const response = await fetch('/api/upload-image', {
                    method: 'POST',
                    body: formData,
                });
                if (!response.ok) throw new Error('Image upload failed');
                const { url } = await response.json();
                editor.chain().focus().setImage({ src: url }).run();
                toast.success('Image uploaded successfully');
            } catch (error) {
                console.error('EditorToolbar: Image upload error', error);
                toast.error('Failed to upload image. Please try again.');
            } finally {
                setIsUploading(false);
                event.target.value = '';
            }
        };

        if (!editor) return null;

        const getTextStyleAttrs = () => editor.getAttributes('textStyle');

        return (
            <TooltipProvider>
                <div className={error ? 'border border-red-500 rounded-md' : ''}>
                    <div className="border border-gray-200 rounded-t-md p-2 bg-white flex flex-wrap gap-2">
                        {/* Text Formatting Group */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editor.chain().focus().toggleBold().run()}
                                    className={editor.isActive('bold') ? 'bg-gray-200' : ''}
                                    disabled={disabled}
                                    aria-label="Toggle bold"
                                >
                                    <Bold className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Bold</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editor.chain().focus().toggleItalic().run()}
                                    className={editor.isActive('italic') ? 'bg-gray-200' : ''}
                                    disabled={disabled}
                                    aria-label="Toggle italic"
                                >
                                    <Italic className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Italic</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                                    className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}
                                    disabled={disabled}
                                    aria-label="Toggle heading 1"
                                >
                                    <Heading className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Heading 1</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                    className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
                                    disabled={disabled}
                                    aria-label="Toggle heading 2"
                                >
                                    <Heading className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Heading 2</TooltipContent>
                        </Tooltip>

                        {/* Font Color Group */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex gap-1 flex-wrap">
                                    {FontColor.options.colors.map((color) => (
                                        <Button
                                            key={color}
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                if (color === getTextStyleAttrs().color) {
                                                    editor.chain().focus().unsetFontColor().run();
                                                } else {
                                                    editor.chain().focus().setFontColor(color).run();
                                                }
                                            }}
                                            className={`p-1 w-6 h-6 rounded-full border ${getTextStyleAttrs().color === color ? 'border-gray-800' : 'border-gray-300'}`}
                                            style={{ backgroundColor: color }}
                                            disabled={disabled}
                                            aria-label={`Select color ${color}`}
                                        >
                                            <span className="sr-only">{color}</span>
                                        </Button>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => editor.chain().focus().unsetFontColor().run()}
                                        className={`p-1 w-6 h-6 rounded-full border ${!getTextStyleAttrs().color ? 'border-gray-800' : 'border-gray-300'} bg-white flex items-center justify-center`}
                                        disabled={disabled}
                                        aria-label="Reset color"
                                    >
                                        <span className="text-xs font-bold">X</span>
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>Font Color</TooltipContent>
                        </Tooltip>

                        {/* Font Size Group */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex gap-1">
                                    {FontSize.options.sizes.map((size) => (
                                        <Button
                                            key={size}
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                if (size === getTextStyleAttrs().fontSize) {
                                                    editor.chain().focus().unsetFontSize().run();
                                                } else {
                                                    editor.chain().focus().setFontSize(size).run();
                                                }
                                            }}
                                            className={`px-2 py-1 ${getTextStyleAttrs().fontSize === size ? 'bg-gray-200' : ''}`}
                                            style={{ fontSize: size }}
                                            disabled={disabled}
                                            aria-label={`Select font size ${size}`}
                                        >
                                            {parseInt(size)}px
                                        </Button>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => editor.chain().focus().unsetFontSize().run()}
                                        className={`px-2 py-1 ${!getTextStyleAttrs().fontSize ? 'bg-gray-200' : ''}`}
                                        disabled={disabled}
                                        aria-label="Reset font size"
                                    >
                                        Default
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>Font Size</TooltipContent>
                        </Tooltip>

                        {/* List Group */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                                    className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
                                    disabled={disabled}
                                    aria-label="Toggle bullet list"
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Bullet List</TooltipContent>
                        </Tooltip>

                        {/* Link and Media Group */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const url = window.prompt('Enter the URL');
                                        if (url) {
                                            editor.chain().focus().setLink({ href: url }).run();
                                        }
                                    }}
                                    className={editor.isActive('link') ? 'bg-gray-200' : ''}
                                    disabled={disabled}
                                    aria-label="Insert link"
                                >
                                    <LinkIcon className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Insert Link</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={disabled || isUploading}
                                    aria-label="Upload image"
                                >
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        id="image-upload"
                                        disabled={disabled || isUploading}
                                    />
                                    <label htmlFor="image-upload" className="flex items-center cursor-pointer">
                                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                                    </label>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Upload Image</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                                    className={editor.isActive('codeBlock') ? 'bg-gray-200' : ''}
                                    disabled={disabled}
                                    aria-label="Insert code block"
                                >
                                    <Code className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Code Block</TooltipContent>
                        </Tooltip>

                        {/* Table Group */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                                    disabled={disabled}
                                    aria-label="Insert table"
                                >
                                    <TableIcon className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Insert Table</TooltipContent>
                        </Tooltip>

                        {/* Text Alignment Group */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                                    className={editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}
                                    disabled={disabled}
                                    aria-label="Align left"
                                >
                                    <AlignLeft className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Align Left</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                                    className={editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}
                                    disabled={disabled}
                                    aria-label="Align center"
                                >
                                    <AlignCenter className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Align Center</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                                    className={editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}
                                    disabled={disabled}
                                    aria-label="Align right"
                                >
                                    <AlignRight className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Align Right</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                                    className={editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200' : ''}
                                    disabled={disabled}
                                    aria-label="Justify"
                                >
                                    <AlignJustify className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Justify</TooltipContent>
                        </Tooltip>

                        {/* History Group */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editor.chain().focus().undo().run()}
                                    disabled={!editor.can().undo() || disabled}
                                    aria-label="Undo"
                                >
                                    <Undo className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Undo</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editor.chain().focus().redo().run()}
                                    disabled={!editor.can().redo() || disabled}
                                    aria-label="Redo"
                                >
                                    <Redo className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Redo</TooltipContent>
                        </Tooltip>
                    </div>
                    <EditorContent
                        editor={editor}
                        className="prose max-w-none min-h-[200px] p-4 border border-t-0 border-gray-200 rounded-b-md bg-white"
                    />
                </div>
            </TooltipProvider>
        );
    }
);

EditorToolbar.displayName = 'EditorToolbar';

export default EditorToolbar;