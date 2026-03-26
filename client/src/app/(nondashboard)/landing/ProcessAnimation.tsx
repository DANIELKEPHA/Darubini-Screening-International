"use client";
import React from "react";
import { motion, Variants } from "framer-motion";
import { FaComments, FaClipboardList, FaChartBar } from "react-icons/fa";

/* ------------------ Animated Consultation Icon ------------------ */
const ConsultationIcon = () => {
    return (
        <motion.div
            animate={{
                rotate: [0, 5, -5, 5, 0],
                y: [0, -5, 5, -5, 0],
            }}
            transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
            }}
        >
            <div className="relative">
                <FaComments size={50} />
                <motion.div
                    className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full"
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                    }}
                />
                <motion.div
                    className="absolute -top-1 -right-5 w-3 h-3 bg-blue-400 rounded-full"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.6, 0.9, 0.6],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: 0.5,
                    }}
                />
            </div>
        </motion.div>
    );
};

/* ------------------ Animated Planning Icon ------------------ */
const PlanningIcon = () => {
    return (
        <motion.div className="relative h-16 w-16">
            {[0, 1, 2, 3].map((i) => (
                <motion.div
                    key={i}
                    className="absolute bg-white rounded-sm shadow-sm"
                    style={{
                        width: 36 - i * 6,
                        height: 48 - i * 8,
                        left: i * 6,
                        top: i * 4,
                    }}
                    animate={{
                        y: [0, -2, 0],
                        rotateZ: [0, -1 + i * 0.5, 0],
                    }}
                    transition={{
                        duration: 3 + i,
                        repeat: Infinity,
                        delay: i * 0.3,
                    }}
                >
                    <div className="absolute top-1 left-1 w-3 h-1 bg-green-300 rounded-full" />
                    <div className="absolute top-4 left-1 w-6 h-1 bg-green-300 rounded-full" />
                    <div className="absolute top-7 left-1 w-4 h-1 bg-green-300 rounded-full" />
                </motion.div>
            ))}
            <motion.div
                className="absolute top-10 left-6 w-6 h-1 bg-green-500 rounded-full"
                animate={{
                    x: [0, 4, 0],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: 0.5,
                }}
            />
        </motion.div>
    );
};

/* ------------------ Animated Reporting Icon ------------------ */
const ReportingIcon = () => {
    return (
        <motion.svg
            width="70"
            height="70"
            viewBox="0 0 100 100"
            className="relative"
        >
            {/* X-axis */}
            <line x1="20" y1="80" x2="80" y2="80" stroke="currentColor" strokeWidth="2" />

            {/* Y-axis */}
            <line x1="20" y1="80" x2="20" y2="20" stroke="currentColor" strokeWidth="2" />

            {/* Graph lines */}
            {[
                { points: [30, 60, 50, 30, 70, 50], color: "#9F7AEA" },
                { points: [30, 40, 50, 60, 70, 30], color: "#667EEA" },
            ].map((line, i) => (
                <motion.polyline
                    key={i}
                    points={line.points.map((p, idx) =>
                        `${20 + (idx % 2 === 0 ? idx/2 * 20 : 0)},${80 - p}`
                    ).join(" ")}
                    fill="none"
                    stroke={line.color}
                    strokeWidth="3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                        duration: 2,
                        delay: 0.5 + i * 0.3,
                    }}
                />
            ))}

            {/* Animated dots */}
            {[30, 50, 70].map((x, i) => (
                <motion.circle
                    key={i}
                    cx={x}
                    cy={80 - [60, 30, 50][i]}
                    r="4"
                    fill="#9F7AEA"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{
                        duration: 0.5,
                        delay: 1 + i * 0.2,
                    }}
                />
            ))}

            {[30, 50, 70].map((x, i) => (
                <motion.circle
                    key={i + 3}
                    cx={x}
                    cy={80 - [40, 60, 30][i]}
                    r="4"
                    fill="#667EEA"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{
                        duration: 0.5,
                        delay: 1.5 + i * 0.2,
                    }}
                />
            ))}
        </motion.svg>
    );
};

/* ------------------ Realistic Gear Icon ------------------ */
const GearIcon = () => {
    return (
        <svg
            width="70"
            height="70"
            viewBox="0 0 200 200"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Large Gear */}
            <motion.g
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                style={{ transformOrigin: "50px 50px" }}
            >
                <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="8" fill="none" />
                {[...Array(12)].map((_, i) => (
                    <rect
                        key={i}
                        x="48"
                        y="10"
                        width="4"
                        height="10"
                        fill="currentColor"
                        transform={`rotate(${i * 30} 50 50)`}
                    />
                ))}
            </motion.g>

            {/* Medium Gear */}
            <motion.g
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
                style={{ transformOrigin: "120px 50px" }}
            >
                <circle cx="120" cy="50" r="20" stroke="currentColor" strokeWidth="6" fill="none" />
                {[...Array(10)].map((_, i) => (
                    <rect
                        key={i}
                        x="118"
                        y="30"
                        width="4"
                        height="8"
                        fill="currentColor"
                        transform={`rotate(${i * 36} 120 50)`}
                    />
                ))}
            </motion.g>

            {/* Small Gear */}
            <motion.g
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                style={{ transformOrigin: "160px 80px" }}
            >
                <circle cx="160" cy="80" r="15" stroke="currentColor" strokeWidth="4" fill="none" />
                {[...Array(8)].map((_, i) => (
                    <rect
                        key={i}
                        x="158"
                        y="65"
                        width="4"
                        height="6"
                        fill="currentColor"
                        transform={`rotate(${i * 45} 160 80)`}
                    />
                ))}
            </motion.g>
        </svg>
    );
};

/* ------------------ Step Data ------------------ */
const steps = [
    {
        title: "Consultation",
        description: "We listen to your needs and understand your requirements through detailed discussions and analysis.",
        icon: <ConsultationIcon />,
        color: "text-blue-400",
    },
    {
        title: "Planning",
        description: "We prepare a comprehensive strategy and detailed plan of action tailored to your goals.",
        icon: <PlanningIcon />,
        color: "text-green-400",
    },
    {
        title: "Execution",
        description: "Our team implements the plan with precision, dedication, and continuous quality checks.",
        icon: <GearIcon />,
        color: "text-yellow-400",
    },
    {
        title: "Reporting",
        description: "We deliver insightful reports with measurable results and actionable recommendations.",
        icon: <ReportingIcon />,
        color: "text-purple-400",
    },
];

/* ------------------ Animation Variants ------------------ */
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.5,
            delayChildren: 0.3,
        },
    },
};

const stepVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15,
        },
    },
    hover: {
        y: -15,
        backgroundColor: "rgba(74, 0, 0, 0.8)",
        transition: { duration: 0.3 },
    },
};

const iconVariants: Variants = {
    hidden: { scale: 0.5, rotate: -30 },
    visible: {
        scale: 1,
        rotate: 0,
        transition: {
            type: "spring",
            bounce: 0.5,
            delay: 0.5,
        },
    },
    hover: {
        scale: 1.2,
        transition: { duration: 0.3 },
    },
};

const textVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { delay: 0.8 },
    },
};

/* ------------------ Progress Line Component ------------------ */
const ProgressLine = ({ index, total }: { index: number; total: number }) => {
    if (index >= total - 1) return null;

    return (
        <div className="hidden md:block absolute right-[-2.5rem] top-1/2 h-1 w-12 overflow-hidden">
            <motion.div
                className="absolute h-full bg-yellow-500"
                initial={{ width: 0, x: -24 }}
                animate={{
                    width: [0, 24, 24, 0],
                    x: [-24, 0, 24, 24],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatDelay: 0.5,
                    delay: index * 0.5,
                    ease: "easeInOut",
                    times: [0, 0.3, 0.7, 1],
                }}
                style={{
                    width: 24,
                }}
            />
        </div>
    );
};

/* ------------------ Component ------------------ */
export default function WorkflowAnimation() {
    return (
        <div className="bg-[#320000] text-white py-20 px-4">
            <motion.h2
                className="text-5xl font-bold text-center mb-16"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                Our Working Process
            </motion.h2>

            <motion.div
                className="max-w-6xl mx-auto grid md:grid-cols-4 gap-10 relative"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {steps.map((step, index) => (
                    <motion.div
                        key={index}
                        className="flex flex-col items-center text-center p-8 bg-[#4a0000]/80 rounded-xl shadow-xl backdrop-blur-sm border border-[#5a0000] min-h-[300px]"
                        variants={stepVariants}
                        whileHover="hover"
                    >
                        <motion.div
                            className={`mb-6 ${step.color}`}
                            variants={iconVariants}
                        >
                            {step.icon}
                        </motion.div>

                        <motion.h3
                            className="text-2xl font-semibold mb-4"
                            variants={textVariants}
                        >
                            {step.title}
                        </motion.h3>

                        <motion.p
                            className="text-base text-gray-300"
                            variants={textVariants}
                        >
                            {step.description}
                        </motion.p>

                        <ProgressLine index={index} total={steps.length} />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}