"use client";

import {Easing, motion, useAnimation} from "framer-motion";
import { useInView } from "react-intersection-observer";
import React, { useEffect } from "react";

const ServicesSection = () => {
    const controls = useAnimation();
    const [ref, inView] = useInView({
        threshold: 0.3, // Trigger when 30% of section is visible
        triggerOnce: false // Replay animation on scroll in/out
    });

    useEffect(() => {
        if (inView) {
            controls.start("visible");
        } else {
            controls.start("hidden"); // Reset to hidden when out of view
        }
    }, [controls, inView]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2, // Increased stagger for visibility
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = (index: number) => ({
        hidden: {
            opacity: 0,
            y: 80, // Increased for more noticeable animation
            translateY: index % 3 === 1 ? 150 : index % 3 === 2 ? 300 : 0 // Card 2: 150px, Card 3: 300px, Card 1/4/7/10: 0px
        },
        visible: {
            opacity: 1,
            y: 0,
            translateY: 0, // Align cards in row
            transition: {
                duration: 1, // Slower for visibility
                ease: [0.16, 0.77, 0.47, 0.97] as Easing,
            }
        }
    });

    // Placeholder services data
    const services = [
        {
            title: "Private Investigation",
            description: "We offers a range of services including fraud and corruption investigations, performance and grievance investigations, forensic accounting, and financial investigations to help clients quickly and effectively address challenges."
        },
        {
            title: "Document Verification",
            description: "Document Verification allows organisations to take information taken from a person's identity document, with their consent, and compare this against the corresponding record of the document issuing agency."
        },
        {
            title: "Vetting and Screening",
            description: "Vetting and screening are processes used to evaluate and assess individuals, organizations, or information to ensure suitability, reliability, and safety."
        },
        {
            title: "Domestic Staff",
            description: "Our Domestic Workers tests provide you with necessary information you require to ensure that your domestic help has a clean bill of health before they become part of the household."
        },
        {
            title: "Criminal Checks",
            description: "A Criminal Record Check is a crucial step towards a comprehensive employee screening programme for many organisations. Darubini is committed to providing a high-quality, innovative service to help those organisations to make faster and smarter hiring decisions."
        },
        {
            title: "For Corporate",
            description: "For companies wishing to hire new employees or contractors, a pre-employment screening program can minimize risk of employee theft, misappropriation, criminal activity or violence in the work place. It can also minimize negligent hiring lawsuits."
        },
        {
            title: "Fraud Awareness",
            description: "Fraud, involving deception and dishonestly, is a global issue affecting economies, businesses, and individuals, with increasing threats to organizations such as bribery, corruption, identity fraud, and Ponzi schemes."
        },
        {
            title: "Tenant Screening",
            description: "Tenant screening is crucial for letting out investment property in Kenya, as it helps make informed decisions about tenants and ensures trustworthiness in the market."
        },

    ];

    return (
        <section
            className="bg-gradient-to-br from-primary-800 to-primary-700 text-white py-24 px-6 sm:px-8"
            ref={ref}
        >
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <motion.div
                    initial="hidden"
                    animate={controls}
                    variants={containerVariants}
                >
                    <motion.div variants={itemVariants(0)} className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                            Solutions <span className="text-yellow-400">That Set Us Apart</span>
                        </h2>
                        <p className="text-xl text-primary-200 max-w-3xl mx-auto">
                            Discover our comprehensive range of professional services designed to meet your business needs with excellence and innovation.
                        </p>
                    </motion.div>

                    {/* Services Grid */}
                    <motion.div
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                        variants={containerVariants}
                        initial="hidden"
                        animate={controls}
                    >
                        {services.map((service, index) => (
                            <motion.div
                                key={index}
                                variants={itemVariants(index)}
                                className="rounded-xl p-8"
                            >
                                <div className="flex items-start mb-4">
                                    <div className="p-3 mr-4">
                                        <div className="w-6 h-6 flex items-center justify-center font-bold">
                                            {index + 1}
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-yellow-400">{service.title}</h3>

                                </div>
                                <p className="text-primary-200 text-base sm:text-lg pl-14">
                                    {service.description}
                                </p>

                            </motion.div>
                        ))}
                    </motion.div>

                    {/* CTA */}
                    <motion.div
                        variants={itemVariants(0)}
                        className="text-center mt-20"
                    >
                        <button className="px-8 py-4 bg-secondary-500 hover:bg-secondary-600 text-primary-900 font-bold rounded-lg text-lg transition-all hover:shadow-lg hover:shadow-secondary-500/20">
                            Request Custom Solution
                        </button>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default ServicesSection;