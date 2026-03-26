"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const HeroSection = () => {
    const router = useRouter();

    const handleDemoClick = () => {
        router.push("/request-demo"); // Assuming your demo page route is "/request-demo"
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-800 to-primary-700 flex flex-col justify-center items-center text-center px-4 sm:px-6 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-secondary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative max-w-7xl w-full space-y-12 px-4 z-10">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="space-y-8"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                    >
                        <motion.h1
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-white mb-8 leading-tight tracking-tight font-sligoil"
                        >
                            Comprehensive
                            <motion.span
                                initial={{ x: -200, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 120,
                                    damping: 18,
                                    mass: 1,
                                    delay: 0.6,
                                }}
                                className="inline-block text-secondary-400"
                            >
                                Background
                            </motion.span>
                            <br />
                            Verification Services
                        </motion.h1>

                        <p className="text-xl text-primary-100 max-w-3xl mx-auto leading-relaxed font-geist">
                            Mitigate risks with our industry-leading background checks, employment verification,
                            and screening services designed for enterprises and institutions.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="flex flex-col sm:flex-row justify-center gap-4 pt-4"
                    >
                        <Button
                            onClick={handleDemoClick}
                            className="h-14 px-8 text-lg bg-secondary-500 hover:bg-secondary-600 rounded-lg transition-all font-geist font-medium"
                            size="lg"
                        >
                            Request a Demo
                        </Button>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default HeroSection;