"use client"

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeCheck, ShieldCheck, Fingerprint, Search, UserCheck, X, ChevronLeft, ChevronRight } from "lucide-react";

interface TeamMember {
    name: string;
    title: string;
    experience: string;
    icon: React.ReactElement;
    details: string[];
    category: string;
}


const TeamSection = () => {
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

    const [activeFilter, setActiveFilter] = useState("all");

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    const teamMembers = [
        {
            name: "Hadija Jama",
            title: "Director",
            experience: "35+ years in Human Resource Management",
            icon: <ShieldCheck className="w-6 h-6" />,
            details: [
                "She was the first Vice chair of ASIS Kenyan chapter",
                "Formerly at CFC/Stanbic, Trade Bank and Citi Bank",
                "Member of American Society for Industrial Security (ASIS), International and local",
                "Attended ASIS conferences in Los Angeles, Dallas, Las Vegas, Chicago, Lagos, and Abuja",
                "Oversees staff balance in terms of skills and experience"
            ],
            category: "leadership"
        },
        {
            name: "Mose Hesbon",
            title: "Investigation Specialist",
            experience: "Senior Verification Specialist",
            icon: <Fingerprint className="w-6 h-6" />,
            details: [
                "Criminologist with exceptional leadership skills",
                "Systematic and determined mindset",
                "Proactive and results-oriented approach",
                "Meticulous document validation",
                "Office Admin Assistant responsibilities"
            ],
            category: "investigation"
        },
        {
            name: "Mercy Ngeru",
            title: "Assistant Investigation Specialist",
            experience: "Forensic Scientist",
            icon: <UserCheck className="w-6 h-6" />,
            details: [
                "Former Forensic Analyst at Kenya Wildlife Services",
                "Passionate about Data analytics",
                "Strong attention to detail and integrity",
                "Critical thinking and analytical skills",
                "Fast learner with sound judgment"
            ],
            category: "investigation"
        },
        {
            name: "Faith Njambi Mungai",
            title: "Assistant Verification Officer",
            experience: "Customer Service & Legal Support",
            icon: <Search className="w-6 h-6" />,
            details: [
                "Handles background checks and ensures compliance",
                "BA in Criminology & Security Studies from Chuka University",
                "Experience in legal administration at Molo Law Courts",
                "Passionate about mentorship and continuous learning",
                "Thrives in fast-paced environments with precision and dedication"
            ],
            category: "verification"
        },
        {
            name: "Jacqline Kimaru",
            title: "Assistant Verification Specialist",
            experience: "Forensic Scientist",
            icon: <UserCheck className="w-6 h-6" />,
            details: [
                "Alumna of Alliance Girls High School",
                "Sharp eye for detail and strong analytical skills",
                "Proactive problem solver with innovative solutions",
                "Demonstrates dedication and resilience",
                "Committed to integrity and excellence"
            ],
            category: "verification"
        },
        {
            name: "Kevin Oyugi",
            title: "Assistant Verification Specialist",
            experience: "Forensic Scientist",
            icon: <UserCheck className="w-6 h-6" />,
            details: [
                "Expertise in analytical research and forensic investigations",
                "Skilled in background verification and financial risk assessments",
                "Highly analytical with strong problem-solving skills",
                "Perfectionist ensuring precision and accuracy",
                "Exceptional communication and teamwork abilities"
            ],
            category: "verification"
        }
    ];

    const filteredMembers = activeFilter === "all"
        ? teamMembers
        : teamMembers.filter(member => member.category === activeFilter);

    const categories = [
        { id: "all", name: "All Team" },
        { id: "leadership", name: "Leadership" },
        { id: "investigation", name: "Investigation" },
        { id: "verification", name: "Verification" }
    ];

    return (
        <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
                visible: {
                    transition: { staggerChildren: 0.1 }
                }
            }}
            className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gradient-to-b from-primary-50 to-white relative overflow-hidden"
        >
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

            <div className="relative z-10">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="inline-block mb-4"
                    >
                        <span className="text-primary-600 font-semibold tracking-wide uppercase">Our Experts</span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-4xl md:text-5xl font-bold text-primary-900 mb-6"
                    >
                        Meet Our <span className="text-primary-600">Talented Team</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="text-xl text-primary-700 max-w-3xl mx-auto"
                    >
                        Dedicated professionals bringing expertise and excellence to Darubini Screening International
                    </motion.p>
                </div>

                {/* Category filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="flex flex-wrap justify-center gap-4 mb-12"
                >
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setActiveFilter(category.id)}
                            className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                                activeFilter === category.id
                                    ? "bg-primary-600 text-white shadow-lg"
                                    : "bg-white text-primary-600 border border-primary-200 hover:bg-primary-50"
                            }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </motion.div>

                {/* Team grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="wait">
                        {filteredMembers.map((member, index) => (
                            <motion.div
                                key={member.name}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.4 }}
                                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-primary-100 group cursor-pointer"
                                onClick={() => setSelectedMember(member)}
                            >
                                <div className="relative h-48 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-b from-primary-500 to-primary-700 opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-white transform group-hover:scale-110 transition-transform duration-300">
                                            {member.icon}
                                        </div>
                                    </div>
                                    <div className="absolute bottom-4 left-4 text-white">
                                        <h3 className="text-xl font-bold">{member.name}</h3>
                                        <p className="text-primary-100">{member.title}</p>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="mb-4">
                                        <span className="inline-block bg-primary-100 text-primary-700 text-xs font-semibold px-3 py-1 rounded-full">
                                            {member.experience}
                                        </span>
                                    </div>
                                    <ul className="space-y-2">
                                        {member.details.slice(0, 3).map((detail, i) => (
                                            <li key={i} className="flex items-start">
                                                <BadgeCheck className="w-4 h-4 text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                                                <span className="text-primary-700 text-sm line-clamp-2">{detail}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <button className="mt-4 text-primary-600 font-medium text-sm flex items-center group-hover:underline">
                                        View full profile
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Member Detail Modal */}
            <AnimatePresence>
                {selectedMember && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedMember(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative">
                                <button
                                    onClick={() => setSelectedMember(null)}
                                    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 text-primary-700 flex items-center justify-center shadow-md hover:bg-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="h-48 bg-gradient-to-r from-primary-500 to-primary-700 relative overflow-hidden rounded-t-2xl">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center text-white">
                                            {selectedMember.icon}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8">
                                    <div className="text-center mb-6">
                                        <h3 className="text-3xl font-bold text-primary-900">{selectedMember.name}</h3>
                                        <p className="text-primary-600 text-xl mt-2">{selectedMember.title}</p>
                                        <div className="mt-4 inline-block bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium">
                                            {selectedMember.experience}
                                        </div>
                                    </div>
                                    <div className="border-t border-primary-100 pt-6">
                                        <h4 className="text-xl font-semibold text-primary-800 mb-4">Key Expertise</h4>
                                        <ul className="space-y-3">
                                            {selectedMember.details.map((detail, i) => (
                                                <motion.li
                                                    key={i}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="flex items-start"
                                                >
                                                    <BadgeCheck className="w-5 h-5 text-primary-500 mt-0.5 mr-3 flex-shrink-0" />
                                                    <span className="text-primary-700">{detail}</span>
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </motion.section>
    );
};

export default TeamSection;