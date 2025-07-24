import React from "react";
import { motion } from "framer-motion";

const AboutCards = () => {
    const cards = [
        {
            title: "About Us",
            bgColor: "bg-primary-50",
            textColor: "text-primary-900",
            description: (
                <>
                    <p className="mb-6 text-lg leading-relaxed">
                        At <strong className="font-bold">Darubini Screening</strong>, we deliver a robust and tailored employee vetting and background screening program designed to help businesses make informed hiring decisions and reduce the risk of unsuitable recruitment. We recognize that no two organizations are alike — each role demands unique competencies, experience levels, and security considerations.
                    </p>
                    <p className="mb-6 text-lg leading-relaxed">
                        Our screening solutions are built around the specific needs of your organization. Whether you operate in the public or private sector, we offer clearly defined background check packages that are aligned with industry best practices and regulatory requirements. From identity verification and reference checks to criminal history and security clearance procedures, we ensure a thorough and compliant approach.
                    </p>
                    <p className="text-lg leading-relaxed">
                        We maintain proactive and transparent communication with our clients throughout the process, providing timely updates and expert guidance. With our proven experience in designing and implementing screening protocols, we support your mission to build trustworthy, secure, and high-performing teams.
                    </p>
                </>
            ),
        },

    ];

    return (
        <div className="font-sans antialiased">
            <section className="w-full overflow-hidden">
                {cards.map((card, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: index * 0.2 }}
                        className={`w-full ${card.bgColor} ${card.textColor} py-16 px-6`}
                    >
                        <div className="container mx-auto max-w-5xl">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="bg-white p-10 rounded-2xl shadow-lg"
                            >
                                <motion.h2
                                    initial={{ x: -20 }}
                                    whileInView={{ x: 0 }}
                                    viewport={{ once: true }}
                                    className="text-3xl md:text-4xl font-bold mb-8 relative inline-block font-sligoil"
                                >
                                    <span className="relative z-10">{card.title}</span>
                                    <span className={`absolute bottom-1 left-0 w-full h-3 bg-primary-200 -z-0 opacity-80`}></span>
                                </motion.h2>
                                <div className="space-y-6">
                                    {card.description}
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                ))}
            </section>
        </div>
    );
};

export default AboutCards;