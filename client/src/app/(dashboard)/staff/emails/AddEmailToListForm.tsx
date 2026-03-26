"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { EmailList } from "@/types/prismaTypes";
import { useAddEmailToListMutation } from "@/state/api";

interface AddEmailToListFormProps {
    emailLists: EmailList[];
    isLoading: boolean;
}

const AddEmailToListForm: React.FC<AddEmailToListFormProps> = ({ emailLists, isLoading }) => {
    const [selectedListId, setSelectedListId] = useState<number | null>(null);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [addEmailToList, { isLoading: isAdding }] = useAddEmailToListMutation();

    const handleAddEmail = async () => {
        if (!selectedListId) {
            toast.error("Please select an email list");
            return;
        }
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("email", email);
            if (name) formData.append("name", name);

            await addEmailToList({ listId: selectedListId, formData }).unwrap();

            setEmail("");
            setName("");
            toast.success("Email added to list successfully");
        } catch (error) {
            toast.error("Failed to add email to list");
            console.error("Add email error:", error);
        }
    };


    return (
        <motion.div
            className="p-6 bg-white rounded-xl shadow-md border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary-500" />
                Add Email to List
            </h2>
            <div className="space-y-4">
                <select
                    value={selectedListId || ""}
                    onChange={(e) => setSelectedListId(parseInt(e.target.value) || null)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={isLoading || isAdding || emailLists.length === 0}
                >
                    <option value="">Select Email List</option>
                    {emailLists.map((list) => (
                        <option key={list.id} value={list.id}>
                            {list.name}
                        </option>
                    ))}
                </select>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={isAdding}
                />
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name (optional)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={isAdding}
                />
                <motion.button
                    onClick={handleAddEmail}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={isAdding || !selectedListId}
                    className={`w-full px-4 py-3 rounded-lg transition-all ${
                        isAdding || !selectedListId
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-primary-500 text-white hover:bg-primary-600"
                    }`}
                >
                    {isAdding ? "Adding..." : "Add Email"}
                </motion.button>
            </div>
        </motion.div>
    );
};

export default AddEmailToListForm;