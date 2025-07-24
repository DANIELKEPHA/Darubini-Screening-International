import React from "react";
import { motion } from "framer-motion";
import { BadgeCheck, ShieldCheck, Fingerprint, Search, UserCheck } from "lucide-react";

const TeamSection = () => {
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const teamMembers = [
        {
            name: "Hadija Jama",
            title: "Director",
            experience: "35+ years in Human Resource Management",
            icon: <ShieldCheck className="w-6 h-6" />,
            details: [
                "Vice chair of ASIS Kenyan chapter",
                "Formerly at CFC/Stanbic, Trade Bank and Citi Bank",
                "Member of American Society for Industrial Security (ASIS)",
                "Attended ASIS conferences in Los Angeles, Dallas, Las Vegas, Chicago, Lagos, and Abuja",
                "Oversees staff balance in terms of skills and experience"
            ]
        },
        {
            name: "George Arum",
            title: "Investigation & Verification Specialist",
            experience: "15+ years in security consultancy",
            icon: <Search className="w-6 h-6" />,
            details: [
                "Criminologist with MA in Criminology and Social Order",
                "Certified Fraud Examiner (ACFE)",
                "Member of ASIS, PTAK, KEPSOC, PROSAK",
                "Investigative experience with Samsung, HP, Epson, Canon, GSK, BBC, Caterpillar",
                "Currently pursuing PhD in Security Studies"
            ]
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
            ]
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
            ]
        }
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
            className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white"
        >
            <div className="text-center mb-16">
                <motion.h2
                    initial={{ scale: 0.9 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="text-3xl font-bold text-primary-700 inline-block relative font-sligoil"
                >
                    Our Expert Team
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-primary-200 transform translate-y-1"></span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 text-lg text-primary-600 max-w-3xl mx-auto"
                >
                    Meet the professionals who bring unparalleled expertise to Sayin Properties
                </motion.p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {teamMembers.map((member, index) => (
                    <motion.div
                        key={index}
                        variants={fadeIn}
                        whileHover={{ y: -10 }}
                        className="bg-white rounded-xl shadow-lg overflow-hidden border border-primary-100 hover:shadow-xl transition-all"
                    >
                        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white text-center">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <div className="text-primary-100">
                                    {member.icon}
                                </div>
                            </div>
                            <h3 className="text-xl font-bold">{member.name}</h3>
                            <p className="text-primary-100">{member.title}</p>
                            <div className="mt-2 text-sm bg-white/10 rounded-full px-3 py-1 inline-block">
                                {member.experience}
                            </div>
                        </div>

                        <div className="p-6">
                            <ul className="space-y-3">
                                {member.details.map((detail, i) => (
                                    <motion.li
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.1 * i }}
                                        className="flex items-start"
                                    >
                                        <BadgeCheck className="w-5 h-5 text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                                        <span className="text-gray-700 text-sm">{detail}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                ))}
            </div>


        </motion.section>
    );
};

export default TeamSection;