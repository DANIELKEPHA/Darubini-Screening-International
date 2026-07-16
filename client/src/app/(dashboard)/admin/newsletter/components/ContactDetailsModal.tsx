"use client";

import React from 'react';
import { X, Mail, User, Calendar, Tag, MessageSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Contact } from '@/state';
import { motion, AnimatePresence } from 'framer-motion';

interface ContactDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact: Contact | null;
}

const ContactDetailsModal: React.FC<ContactDetailsModalProps> = ({
                                                                     isOpen,
                                                                     onClose,
                                                                     contact,
                                                                 }) => {
    if (!contact) return null;

    const formatDate = (date: string) => {
        return format(new Date(date), 'EEEE, MMMM do, yyyy • h:mm a');
    };

    const getInterestColor = (interest: string) => {
        const colors: Record<string, string> = {
            'Web Development': 'bg-blue-100 text-blue-700',
            'Mobile Development': 'bg-green-100 text-green-700',
            'AI & Machine Learning': 'bg-purple-100 text-purple-700',
            'Cloud Computing': 'bg-cyan-100 text-cyan-700',
            'DevOps': 'bg-orange-100 text-orange-700',
            'UI/UX Design': 'bg-pink-100 text-pink-700',
            'Data Science': 'bg-indigo-100 text-indigo-700',
            'Cybersecurity': 'bg-red-100 text-red-700',
        };
        return colors[interest] || 'bg-gray-100 text-gray-700';
    };

    const interestList = contact.interests?.split(',').map(i => i.trim()) || [];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header with gradient */}
                        <div className="relative bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-8">
                            <button
                                onClick={onClose}
                                className="absolute right-4 top-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                aria-label="Close modal"
                            >
                                <X size={24} />
                            </button>

                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                                    <User className="text-white" size={32} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{contact.name}</h2>
                                    <p className="text-primary-100 flex items-center gap-2 mt-1">
                                        <Mail size={16} />
                                        {contact.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-6">
                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                    <Calendar className="text-primary-500 mt-0.5" size={18} />
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</p>
                                        <p className="text-sm font-medium text-gray-900 mt-1">
                                            {formatDate(contact.createdAt)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                    <Clock className="text-primary-500 mt-0.5" size={18} />
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Time</p>
                                        <p className="text-sm font-medium text-gray-900 mt-1">
                                            {format(new Date(contact.createdAt), 'h:mm a')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Interests */}
                            {interestList.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Tag className="text-primary-500" size={18} />
                                        <h3 className="text-sm font-semibold text-gray-700">Interests</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {interestList.map((interest, index) => (
                                            <span
                                                key={index}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getInterestColor(interest)}`}
                                            >
                        {interest}
                      </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Message */}
                            {contact.message && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="text-primary-500" size={18} />
                                        <h3 className="text-sm font-semibold text-gray-700">Message</h3>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                            {contact.message}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Footer Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        window.location.href = `mailto:${contact.email}`;
                                    }}
                                    className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-xl transition-all shadow-sm hover:shadow-md"
                                >
                                    <Mail size={16} className="inline mr-2" />
                                    Reply via Email
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ContactDetailsModal;