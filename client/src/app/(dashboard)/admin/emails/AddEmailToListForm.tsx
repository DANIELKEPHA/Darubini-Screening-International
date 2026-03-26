"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UserPlus, Upload } from "lucide-react";
import { EmailList } from "@/types/prismaTypes";
import { useAddEmailToListMutation } from "@/state/api";

interface AddEmailToListFormProps {
    emailLists: EmailList[];
    isLoading: boolean;
}

const AddEmailToListForm: React.FC<AddEmailToListFormProps> = ({
                                                                   emailLists,
                                                                   isLoading,
                                                               }) => {
    const [selectedListId, setSelectedListId] = useState<number | null>(null);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [addEmailToList, { isLoading: isAdding }] = useAddEmailToListMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedListId) {
            toast.error("Please select an email list");
            return;
        }

        const formData = new FormData();
        if (csvFile) {
            formData.append("csvFile", csvFile);
        } else if (email) {
            if (!/^\S+@\S+\.\S+$/.test(email)) {
                toast.error("Please enter a valid email address");
                return;
            }
            formData.append("email", email);
            if (name) formData.append("name", name);
        } else {
            toast.error("Please provide an email or CSV file");
            return;
        }

        try {
            await addEmailToList({ listId: selectedListId, formData }).unwrap();
            setEmail("");
            setName("");
            setCsvFile(null);
            toast.success(
                csvFile ? "Emails added to list successfully" : "Email added to list successfully"
            );
        } catch (error: any) {
            console.error("Add email error:", error);
            toast.error(
                error.data?.message || "Failed to add email(s) to list",
                { description: error.data?.details?.skippedEmails?.join(", ") }
            );
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== "text/csv") {
                toast.error("Please upload a valid CSV file");
                return;
            }
            setCsvFile(file);
            setEmail("");
            setName("");
        } else {
            setCsvFile(null);
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
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="emailList" className="block text-sm font-medium text-gray-700">
                        Email List
                    </label>
                    <select
                        id="emailList"
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
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        disabled={isAdding || csvFile !== null}
                    />
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Name (optional)
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter name"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        disabled={isAdding || csvFile !== null}
                    />
                </div>
                <div>
                    <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700">
                        Upload CSV
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            id="csvFile"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="w-full p-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary-100 file:text-primary-700 hover:file:bg-primary-200"
                            disabled={isAdding || email !== ""}
                        />
                        {csvFile && (
                            <span className="text-sm text-gray-600 truncate max-w-xs">
                {csvFile.name}
              </span>
                        )}
                    </div>
                </div>
                <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={isAdding || !selectedListId || (!email && !csvFile)}
                    className={`w-full px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                        isAdding || !selectedListId || (!email && !csvFile)
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-primary-500 text-white hover:bg-primary-600"
                    }`}
                >
                    {csvFile ? <Upload className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                    {isAdding ? "Adding..." : csvFile ? "Upload CSV" : "Add Email"}
                </motion.button>
            </form>
        </motion.div>
    );
};

export default AddEmailToListForm;