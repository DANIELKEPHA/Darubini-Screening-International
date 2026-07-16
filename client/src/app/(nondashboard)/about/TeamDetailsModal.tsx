"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    BadgeCheck,
    Mail,
    Phone,
    Calendar,
    MapPin,
    Award,
    BookOpen,
    Briefcase,
    GraduationCap,
    Star,
    Users,
    Clock,
    ChevronRight,
} from "lucide-react";

interface TeamMember {
    name: string;
    title: string;
    experience: string;
    icon: React.ReactElement;
    details: string[];
    category: string;
}

interface TeamDetailsModalProps {
    member: TeamMember | null;
    onClose: () => void;
}

const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({ member, onClose }) => {
    if (!member) return null;

    // Placeholder contact information - replace with real data later
    const contactInfo = {
        email: `${member.name.toLowerCase().replace(/\s/g, ".")}@darubini.co.ke`,
        phone: "+254 700 000 000",
        location: "Nairobi, Kenya",
        joinedDate: "January 2024",
    };

    // Placeholder stats - replace with real data later
    const stats = {
        projects: 47,
        clients: 23,
        experience: member.experience,
        satisfaction: "98%",
    };

    // Clone the icon with proper type safety
    const renderIcon = (icon: React.ReactElement, className: string) => {
        // Create a new props object with the className
        const newProps = {
            className: className,
        };

        // Clone the element with the new props
        return React.cloneElement(icon, newProps);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with background gradient */}
                    <div className="relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm text-primary-700 flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all duration-300"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="h-64 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 relative overflow-hidden">
                            {/* Decorative pattern */}
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,_white_0%,_transparent_60%)]"></div>
                                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                            </div>

                            <div className="absolute bottom-6 left-0 right-0 text-center text-white">
                                <h3 className="text-3xl font-bold tracking-tight">{member.name}</h3>
                                <p className="text-primary-100 text-lg mt-1">{member.title}</p>
                                <span className="inline-block mt-2 px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                  {member.category.charAt(0).toUpperCase() + member.category.slice(1)} Team
                </span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 md:p-10">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Right Column - Details & Stats */}
                            <div className="lg:col-span-2 space-y-6">

                                {/* Key Expertise */}
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Briefcase className="w-6 h-6 text-primary-500" />
                                        <h4 className="text-xl font-bold text-primary-800">Key Expertise</h4>
                                    </div>
                                    <ul className="space-y-3">
                                        {member.details.map((detail, i) => (
                                            <motion.li
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="flex items-start gap-3 p-3 bg-primary-50/50 rounded-xl hover:bg-primary-50 transition-colors"
                                            >
                                                <BadgeCheck className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-primary-700 text-sm leading-relaxed">{detail}</span>
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Professional Summary */}
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <BookOpen className="w-6 h-6 text-primary-500" />
                                        <h4 className="text-xl font-bold text-primary-800">Professional Summary</h4>
                                    </div>
                                    <div className="bg-primary-50/50 rounded-xl p-5">
                                        <p className="text-primary-700 text-sm leading-relaxed">
                                            {member.name} brings {stats.experience} to Darubini Screening International.
                                            As a {member.title.toLowerCase()} in the {member.category} team, {member.name.split(" ")[0]}
                                            demonstrates exceptional expertise in their field. Their dedication to excellence
                                            and commitment to delivering high-quality results has contributed significantly
                                            to the organization&#39;s success and reputation.
                                        </p>
                                    </div>
                                </div>

                                {/* Additional Skills */}
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Star className="w-6 h-6 text-primary-500" />
                                        <h4 className="text-xl font-bold text-primary-800">Core Competencies</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            "Strategic Planning",
                                            "Risk Assessment",
                                            "Data Analysis",
                                            "Team Collaboration",
                                            "Problem Solving",
                                            "Communication",
                                            "Leadership",
                                            "Attention to Detail",
                                        ].map((skill, idx) => (
                                            <span
                                                key={idx}
                                                className="px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium hover:bg-primary-200 transition-colors"
                                            >
                                                 {skill}
                                             </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default TeamDetailsModal;