// app/(Items)/admin/emails/lists/page.tsx
"use client";

import { useGetEmailListsQuery } from "@/state/api";
import { useState } from "react";
import CreateListForm from "@/app/(dashboard)/admin/emails/CreateListForm";
import AddEmailToListForm from "@/app/(dashboard)/admin/emails/AddEmailToListForm";
import EmailLists from "@/app/(dashboard)/admin/emails/EmailLists";

export default function ContactListsPage() {
    const { data: emailLists, isLoading } = useGetEmailListsQuery({
        page: 1,
        limit: 10,
    });
    const [selectedListId, setSelectedListId] = useState<number | null>(null);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Contact Lists</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <CreateListForm />
                    <AddEmailToListForm
                        emailLists={emailLists || []}
                        isLoading={isLoading}
                    />
                </div>

                <EmailLists
                    emailLists={emailLists}
                    isLoading={isLoading}
                    selectedListId={selectedListId}
                    onSelectList={setSelectedListId}
                />
            </div>
        </div>
    );
}