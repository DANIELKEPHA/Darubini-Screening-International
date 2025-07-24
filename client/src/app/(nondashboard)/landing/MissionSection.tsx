"use client";

import { Easing, motion, useScroll, useTransform } from "framer-motion";
import React, { useRef } from "react";
import { useInView } from "react-intersection-observer";

const MissionSection = () => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Parallax effects for each block
    const y1 = useTransform(scrollYProgress, [0, 1], [0, 50]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, 150]);
    const y3 = useTransform(scrollYProgress, [0, 1], [0, 250]);

    const [ref1, inView1] = useInView({
        threshold: 0.2,
        triggerOnce: true
    });
    const [ref2, inView2] = useInView({
        threshold: 0.2,
        triggerOnce: true
    });
    const [ref3, inView3] = useInView({
        threshold: 0.2,
        triggerOnce: true
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3
            }
        }
    };

    const blockVariants = {
        hidden: {
            opacity: 0,
            y: 60,
            scale: 0.98
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.8,
                ease: [0.16, 0.77, 0.47, 0.97] as Easing,
            }
        }
    };

    const lineVariants = {
        hidden: { scaleY: 0, originY: 0 },
        visible: {
            scaleY: 1,
            transition: {
                duration: 1.2,
                ease: [0.16, 0.77, 0.47, 0.97] as Easing,
                delay: 0.4
            }
        }
    };

    const textVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: [0.16, 0.77, 0.47, 0.97] as Easing,
                delay: 0.1 * i
            }
        })
    };

    return (
        <section
            ref={containerRef}
            className="bg-gradient-to-br from-primary-800 to-primary-700 text-white px-6 py-24 sm:py-32 overflow-hidden relative pb-[300px] sm:pb-[400px]"
        >
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-5">
                    <div className="absolute top-0 left-1/4 w-1 h-full bg-secondary-500"></div>
                    <div className="absolute top-0 left-1/2 w-1 h-full bg-secondary-500"></div>
                    <div className="absolute top-0 left-3/4 w-1 h-full bg-secondary-500"></div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-32 md:space-y-48 relative z-10">
                {/* Problem Statement Block */}
                <motion.div
                    ref={ref1}
                    style={{ y: y1 }}
                    initial="hidden"
                    animate={inView1 ? "visible" : "hidden"}
                    variants={containerVariants}
                    className="relative group"
                >
                    {/* Vertical line accent */}
                    <motion.div
                        variants={lineVariants}
                        className="absolute -left-8 top-0 h-full w-1 bg-gradient-to-b from-secondary-500 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                    />

                    {/* Content */}
                    <div className="pl-10">
                        <motion.p
                            variants={textVariants}
                            custom={0}
                            className="text-sm uppercase tracking-widest text-secondary-400 font-geist mb-4"
                        >
                            Why Choose Us?
                        </motion.p>

                        <motion.h2
                            variants={textVariants}
                            custom={1}
                            className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-snug font-sligoil bg-clip-text text-transparent bg-gradient-to-r from-white to-primary-200"
                        >
                            Simplifying Background Checks. Amplifying Trust.
                        </motion.h2>

                        <motion.div variants={containerVariants}>
                            <motion.p
                                variants={textVariants}
                                custom={2}
                                className="mt-6 text-lg md:text-xl text-primary-100/90 font-geist leading-relaxed max-w-3xl"
                            >
                                We understand the critical need for fast, accurate, and transparent screening in today&#39;s competitive talent landscape.
                                With over 80% of HR leaders citing background checks as a vital part of the hiring process, our platform is built
                                to remove friction, reduce turnaround time, and ensure compliance — all while delivering a seamless experience for both
                                recruiters and candidates.
                            </motion.p>

                            <motion.p
                                variants={textVariants}
                                custom={3}
                                className="mt-4 text-lg md:text-xl text-primary-100/80 font-geist leading-relaxed max-w-3xl"
                            >
                                Our intelligent automation tools verify credentials, criminal records, employment history, and more — minimizing human
                                error and maximizing peace of mind. Whether you&#39;re a startup scaling fast or an enterprise managing complex hiring workflows,
                                we tailor solutions that help you move forward with confidence.
                            </motion.p>

                            <motion.p
                                variants={textVariants}
                                custom={4}
                                className="mt-4 text-lg md:text-xl text-primary-100/70 font-geist leading-relaxed max-w-3xl"
                            >
                                Choose a partner who doesn&#39;t just screen – but strengthens your hiring process with integrity, speed, and clarity.
                            </motion.p>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Solution Block */}
                <motion.div
                    ref={ref2}
                    style={{ y: y2 }}
                    initial="hidden"
                    animate={inView2 ? "visible" : "hidden"}
                    variants={containerVariants}
                    className="relative md:ml-20 group"
                >
                    {/* Vertical accent line */}
                    <motion.div
                        variants={lineVariants}
                        className="absolute -left-8 top-0 h-full w-1 bg-gradient-to-b from-secondary-500 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                    />

                    {/* Content block */}
                    <div className="pl-10">
                        <motion.p
                            variants={textVariants}
                            custom={0}
                            className="text-sm uppercase tracking-widest text-secondary-400 font-geist mb-4"
                        >
                            Our Solution
                        </motion.p>

                        <motion.h2
                            variants={textVariants}
                            custom={1}
                            className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-snug font-sligoil bg-clip-text text-transparent bg-gradient-to-r from-white to-primary-200"
                        >
                            Precision Screening, <br className="hidden md:block" />
                            Powered by Intelligent Automation
                        </motion.h2>

                        <motion.div variants={containerVariants}>
                            <motion.p
                                variants={textVariants}
                                custom={2}
                                className="mt-6 text-lg md:text-xl text-primary-100/90 font-geist leading-relaxed max-w-3xl"
                            >
                                Darubini fuses real-time data access, AI-driven validation, and expert review to deliver end-to-end background checks
                                with unmatched speed and accuracy. We reduce verification bottlenecks from days to just hours — without compromising
                                on depth or compliance.
                            </motion.p>

                            <motion.p
                                variants={textVariants}
                                custom={3}
                                className="mt-4 text-lg md:text-xl text-primary-100/80 font-geist leading-relaxed max-w-3xl"
                            >
                                Our modular platform supports multiple screening types — including identity verification, criminal records, education,
                                and employment — all from a single dashboard. Real-time updates, audit trails, and smart alerts ensure that your team
                                stays informed and in control at every stage.
                            </motion.p>

                            <motion.p
                                variants={textVariants}
                                custom={4}
                                className="mt-4 text-lg md:text-xl text-primary-100/70 font-geist leading-relaxed max-w-3xl"
                            >
                                With 99.97% accuracy and full regulatory compliance across jurisdictions, Darubini empowers HR teams, agencies, and
                                enterprises to make faster, smarter hiring decisions.
                            </motion.p>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Vision Block */}
                <motion.div
                    ref={ref3}
                    style={{ y: y3 }}
                    initial="hidden"
                    animate={inView3 ? "visible" : "hidden"}
                    variants={containerVariants}
                    className="relative md:ml-40 group"
                >
                    {/* Vertical accent line */}
                    <motion.div
                        variants={lineVariants}
                        className="absolute -left-8 top-0 h-full w-1 bg-gradient-to-b from-secondary-500 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                    />

                    {/* Content */}
                    <div className="pl-10">
                        <motion.p
                            variants={textVariants}
                            custom={0}
                            className="text-sm uppercase tracking-widest text-secondary-400 font-geist mb-4"
                        >
                            Our Vision
                        </motion.p>

                        <motion.h2
                            variants={textVariants}
                            custom={1}
                            className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-snug font-sligoil bg-clip-text text-transparent bg-gradient-to-r from-white to-primary-200"
                        >
                            Redefining Trust <br className="hidden md:block" />
                            in the Workplace
                        </motion.h2>

                        <motion.div variants={containerVariants}>
                            <motion.p
                                variants={textVariants}
                                custom={2}
                                className="mt-6 text-lg md:text-xl text-primary-100/90 font-geist leading-relaxed max-w-3xl"
                            >
                                We envision a future where trust isn&#39;t assumed — it&#39;s verified. At Darubini, our mission is to create a world where
                                every hiring decision is informed, fair, and rooted in truth. We believe that transparency, accountability, and
                                data-driven insights should be the foundation of every professional relationship.
                            </motion.p>

                            <motion.p
                                variants={textVariants}
                                custom={3}
                                className="mt-4 text-lg md:text-xl text-primary-100/80 font-geist leading-relaxed max-w-3xl"
                            >
                                By 2025, our goal is to become the benchmark for secure, real-time employment verification across Africa and beyond.
                                We&#39;re building an ecosystem where organizations can hire faster and safer — and where candidates feel seen,
                                respected, and empowered by the screening process.
                            </motion.p>

                            <motion.p
                                variants={textVariants}
                                custom={4}
                                className="mt-4 text-lg md:text-xl text-primary-100/70 font-geist leading-relaxed max-w-3xl"
                            >
                                Our long-term vision is not just to provide a service, but to spark a global movement toward verified integrity —
                                where hiring is built on confidence, not guesswork.
                            </motion.p>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default MissionSection;