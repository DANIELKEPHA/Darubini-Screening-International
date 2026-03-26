"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useRef, useEffect } from "react";
import { X, Send, Clock, TestTube2 } from "lucide-react";
import { EmailCampaign } from "@/types/prismaTypes";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Editor as TinyMCEEditor } from "tinymce";

interface CampaignDetailsModalProps {
    campaign: EmailCampaign | null;
    isOpen: boolean;
    onClose: () => void;
    onSendTest: () => void;
    onSchedule: () => void;
    onContentUpdate?: (newContent: string) => void; // Made optional
}

export function CampaignDetailsModal({
                                         campaign,
                                         isOpen,
                                         onClose,
                                         onSendTest,
                                         onSchedule,
                                         onContentUpdate,
                                     }: CampaignDetailsModalProps) {
    const editorRef = useRef<HTMLTextAreaElement>(null);
    const [editorInitialized, setEditorInitialized] = useState(false);

    useEffect(() => {
        if (isOpen && !editorInitialized && typeof window !== "undefined") {
            const script = document.createElement("script");
            script.src = "/tinymce/js/tinymce.min.js";
            script.onload = () => {
                window.tinymce.init({
                    selector: "#campaign-editor",
                    base_url: "/tinymce",
                    skin_url: "/tinymce/skins/ui/oxide",
                    content_css: "/tinymce/skins/content/default/content.min.css",
                    plugins: "lists link image table code help wordcount",
                    toolbar:
                        "undo redo | formatselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | code",
                    height: 400,
                    branding: false,
                    setup: (editor: TinyMCEEditor) => {
                        editor.on("change", () => {
                            onContentUpdate?.(editor.getContent()); // Safe call
                        });
                    },
                    init_instance_callback: (editor: TinyMCEEditor) => {
                        if (campaign?.htmlContent) {
                            editor.setContent(campaign.htmlContent);
                        }
                    },
                });
                setEditorInitialized(true);
            };
            document.head.appendChild(script);
        }

        return () => {
            if (window.tinymce) {
                window.tinymce.remove("#campaign-editor");
            }
        };
    }, [isOpen, campaign?.htmlContent, onContentUpdate]);

    if (!campaign) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-start">
                                    <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">
                                        {campaign.name}
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-500"
                                        onClick={onClose}
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="mt-4 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">
                                                Subject
                                            </h4>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {campaign.subject}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">
                                                Status
                                            </h4>
                                            <StatusBadge status={campaign.status} />
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">
                                            Content
                                        </h4>
                                        <textarea
                                            id="campaign-editor"
                                            ref={editorRef}
                                            style={{ visibility: "hidden" }}
                                            defaultValue={campaign.htmlContent}
                                        />
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={onSendTest}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            <TestTube2 className="mr-2 h-4 w-4" />
                                            Send Test
                                        </button>
                                        <button
                                            type="button"
                                            onClick={onSchedule}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Clock className="mr-2 h-4 w-4" />
                                            Schedule Campaign
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}