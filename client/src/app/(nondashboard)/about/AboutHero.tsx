import React from "react";
import { motion } from "framer-motion";

const AboutHero = () => {
    return (
        <section className="relative bg-primary-500 py-20 overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-b from-primary-600 to-primary-700 opacity-90"></div>
            </div>

            <div className="relative z-10 container mx-auto px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-sligoil mb-6">
                            Comprehensive Employee Vetting & Screening Solutions
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto mb-10"
                    >
                        At Darubini Screening, we help organizations make confident hiring decisions through professional, compliant, and customized background screening services.
                    </motion.p>


                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex justify-center gap-4"
                    >
                        <a
                            href="/files/official-darubini-screening-profile.pdf"
                            download
                            className="px-8 py-3 bg-secondary-500 hover:bg-secondary-600 text-white font-medium rounded-lg transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
                        >
                            Download Company Profile
                        </a>

                        <button className="px-8 py-3 bg-white hover:bg-gray-100 text-primary-600 font-medium rounded-lg transition-all duration-300 transform hover:-translate-y-1 shadow-lg">
                            Contact Us
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Animated decorative elements */}
            <motion.div
                animate={{
                    x: [0, 100, 0],
                    rotate: [0, 180, 360]
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-primary-400 opacity-20"
            />
            <motion.div
                animate={{
                    y: [0, 50, 0],
                    rotate: [0, 90, 180]
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-secondary-400 opacity-20"
            />
        </section>
    );
};

export default AboutHero;