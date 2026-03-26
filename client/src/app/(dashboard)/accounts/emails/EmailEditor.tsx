"use client";

import React, { useCallback, useRef, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { Editor as TinyMCEEditor, TinyMCE } from "tinymce";

interface EmailEditorProps {
    content: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    minHeight?: number;
    init?: Partial<TinyMCE["init"]>;
}

const defaultFooter = `
<hr style="border-top: 1px solid #e0e0e0; margin: 20px 0;" />
    <div style="text-align: center; font-family: Arial, sans-serif; font-size: 12px; color: #555555; line-height: 1.6; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 10px; border-radius: 4px;" contenteditable="false">
    <p style="margin-bottom: 16px;">
    <img src="/logo.png" alt="Darubini Screening International" style="max-width: 180px; height: auto;" />
    </p>
<p style="font-weight: 600; color: #333333; margin-bottom: 8px;">
    Facilitating Safe Recruitment Decisions
</p>
<div style="margin: 16px 0;">
    <a href="https://linkedin.com/company/darubini-screening" style="margin: 0 8px; display: inline-block;">
        <img src="/linkedin-icon.png" alt="LinkedIn" style="width: 20px; height: 20px;" />
    </a>
    <a href="https://wa.me/254721369925" style="margin: 0 8px; display: inline-block;">
        <img src="/whatsapp-icon.png" alt="WhatsApp" style="width: 20px; height: 20px;" />
    </a>
    <a href="https://instagram.com/darubiniscreening" style="margin: 0 8px; display: inline-block;">
        <img src="/instagram-icon.png" alt="Instagram" style="width: 20px; height: 20px;" />
    </a>
    <a href="https://facebook.com/darubiniscreening" style="margin: 0 8px; display: inline-block;">
        <img src="/facebook-icon.png" alt="Facebook" style="width: 20px; height: 20px;" />
    </a>
    <a href="https://tiktok.com/@darubiniscreening" style="margin: 0 8px; display: inline-block;">
        <img src="/tiktok-icon.png" alt="TikTok" style="width: 20px; height: 20px;" />
    </a>
</div>
<div style="margin: 12px 0; font-size: 11px;">
    <p style="margin: 4px 0;">
        <strong>Phone:</strong>
        <a href="tel:+254738743008" style="color: #555555; text-decoration: none;">+254 738 743008</a> |
        <a href="tel:+254772743008" style="color: #555555; text-decoration: none;">+254 772 743008</a> |
        <a href="tel:+254746730594" style="color: #555555; text-decoration: none;">+254 746 730594</a>
    </p>
    <p style="margin: 4px 0;">
        <strong>WhatsApp:</strong>
        <a href="https://wa.me/254780683290" style="color: #555555; text-decoration: none;">+254 780 683290</a> |
        <a href="https://wa.me/254721369925" style="color: #555555; text-decoration: none;">+254 721 369925</a>
    </p>
</div>
<div style="margin: 12px 0; font-size: 11px; color: #777777;">
    <p style="margin: 4px 0;">TRV Office Plaza, 58 Muthithi Road, Westlands</p>
    <p style="margin: 4px 0;">P.O. Box 6079, 00100 Nairobi, Kenya</p>
</div>
<p style="margin-top: 16px; font-size: 10px; color: #999999;">
    &copy; ${new Date().getFullYear()} Darubini Screening International. All rights reserved.
</p>
</div>
`;

export const EmailEditor: React.FC<EmailEditorProps> = ({
    content,
    onChange,
    disabled = false,
    minHeight = 600,
    init = {},
}) => {
    const isInitializing = useRef(true);
    const editorRef = useRef<TinyMCEEditor | null>(null);

    const handleEditorChange = useCallback(
        (newContent: string, editor: TinyMCEEditor) => {
            if (isInitializing.current) {
                isInitializing.current = false;
                return;
            }
            if (newContent !== content) {
                onChange(newContent);
            }
        },
        [onChange, content]
    );

    useEffect(() => {
        if (editorRef.current && isInitializing.current) {
            const currentContent = editorRef.current.getContent();
            const hasFooter = currentContent.includes("Facilitating Safe Recruitment Decisions");
            const isEmpty = currentContent === "" || currentContent === "<p></p>";

            const initialContent = isEmpty
                ? `<h1>Your Email Heading</h1><p>Dear {{NAME}},</p><p>Type your email content here...</p>${defaultFooter}`
                : `${currentContent}${hasFooter ? "" : defaultFooter}`;
            editorRef.current.setContent(initialContent);
            onChange(initialContent);
            console.log("EmailEditor initialized with content:", initialContent);
            isInitializing.current = false;
        }
    }, [onChange]);

    useEffect(() => {
        if (editorRef.current) {
            setTimeout(() => {
                editorRef.current?.execCommand("mceAutoResize");
            }, 100);
        }
    }, []);

    return (
        <div className="h-full w-full relative">
            <Editor
                value={content}
                onEditorChange={handleEditorChange}
                disabled={disabled}
                onInit={(evt, editor) => {
                    editorRef.current = editor;
                    console.log("TinyMCE initialized successfully");
                }}
                init={{
                    tinymceScriptSrc: "/tinymce/tinymce.min.js",
                    height: "100%",
                    min_height: minHeight,
                    menubar: false,
                    plugins:
                        "autoresize advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount",
                    toolbar:
                        "undo redo | styles | bold italic underline strikethrough | forecolor backcolor | " +
                        "alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | " +
                        "link image media table | removeformat | preview code | help",
                    content_style: `
body, html {
    height: 100%;
    margin: 0;
    padding: 0;
}
body {
    font-family: Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    min-height: 100%;
    padding: 20px;
    margin: 0 auto;
    max-width: 800px;
    background-color: white;
}
.mce-content-body[data-mce-placeholder]:before {
    color: #999;
    font-style: italic;
    opacity: 0.7;
}
[contenteditable="false"] {
    background-color: #f5f5f5 !important;
    cursor: not-allowed;
}
@media (min-width: 768px) {
    body {
        padding: 40px;
    }
}
`,
                    placeholder: "Type your email content here...",
                    branding: false,
                    skin_url: "/tinymce/skins/ui/oxide",
                    content_css: "/tinymce/skins/content/default/content.min.css",
                    resize: true,
                    autoresize_bottom_margin: 20,
                    autoresize_on_init: true,
                    setup: (editor) => {
                        editor.on("init", () => {
                            console.log("TinyMCE initialized successfully");
                        });
                        editor.on("BeforeSetContent", (e) => {
                            if (e.content.includes("Facilitating Safe Recruitment Decisions")) {
                                e.content = e.content.replace(
                                    /<div[^>]+Facilitating Safe Recruitment Decisions[^>]+>/,
                                    '<div contenteditable="false" style="text-align: center; font-family: Arial, sans-serif; font-size: 12px; color: #555555; line-height: 1.6; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">'
                                );
                            }
                        });
                    },
                    ...init,
                }}
            />
        </div>
    );
};

export default EmailEditor;