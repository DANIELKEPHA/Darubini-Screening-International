"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useCreateEmailListMutation } from "@/state/api";

const CreateListForm = () => {
    const [newListName, setNewListName] = useState("");
    const [createEmailList] = useCreateEmailListMutation();

    const handleCreateList = async () => {
        if (!newListName) {
            toast.error("List name is required");
            return;
        }
        try {
            await createEmailList({
                name: newListName,
                userIds: [],
                guestUserIds: []
            }).unwrap();
            setNewListName("");
            toast.success("Email list created successfully!");
        } catch (error) {
            toast.error("Failed to create email list");
        }
    };

    return (
        <motion.div
            className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl shadow-md border border-primary-200"
            whileHover={{ scale: 1.01 }}
        >
            <h2 className="text-xl font-semibold text-primary-700 mb-4">
                Create Email List
            </h2>
            <div className="flex gap-4 items-center">
                <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="List Name"
                    className="flex-1 p-3 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <motion.button
                    onClick={handleCreateList}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-primary-500 text-white px-5 py-3 rounded-lg hover:bg-primary-600 transition-all shadow-md"
                >
                    Create List
                </motion.button>
            </div>
        </motion.div>
    );
};

export default CreateListForm;