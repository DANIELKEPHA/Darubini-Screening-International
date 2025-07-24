import React from "react";
import { motion, Variants } from "framer-motion";
import {
    ShieldCheck,
    Fingerprint,
    FileSearch,
    BadgeCheck,
    BarChart2,
    ClipboardCheck,
    Globe,
    Lock, CheckCircle, UserCheck, Home, Briefcase, AlertTriangle, Gavel
} from "lucide-react";

const ServiceHero = () => {
    const container: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const floatingVariants: Variants = {
        float: {
            y: [0, -15, 0],
            transition: {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };
    const services = [
        { icon: <FileSearch className="w-6 h-6" />, text: "Investigation Services" },
        { icon: <CheckCircle className="w-6 h-6" />, text: "Document Verification" },
        { icon: <UserCheck className="w-6 h-6" />, text: "Vetting and Screening" },
        { icon: <Home className="w-6 h-6" />, text: "Domestic Staff Screening" },
        { icon: <ShieldCheck className="w-6 h-6" />, text: "Criminal Checks" },
        { icon: <Briefcase className="w-6 h-6" />, text: "Corporate Screening" },
        { icon: <AlertTriangle className="w-6 h-6" />, text: "Fraud Awareness Training" },
        { icon: <Gavel className="w-6 h-6" />, text: "Tenant Screening" },
    ];

    return (
        <section className="relative bg-gradient-to-br from-primary-700 to-primary-800 py-24 overflow-hidden">
            {/* Animated background elements */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.1 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center"
            />

            {/* Floating animated circles */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{
                        x: Math.random() * 100 - 50,
                        y: Math.random() * 100 - 50,
                        scale: 0.5 + Math.random()
                    }}
                    animate={{
                        x: [0, Math.random() * 200 - 100],
                        y: [0, Math.random() * 200 - 100],
                        transition: {
                            duration: 15 + Math.random() * 10,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "linear"
                        }
                    }}
                    className={`absolute rounded-full opacity-10 ${i % 2 ? 'bg-secondary-400' : 'bg-white'}`}
                    style={{
                        width: `${50 + Math.random() * 100}px`,
                        height: `${50 + Math.random() * 100}px`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`
                    }}
                />
            ))}

            <div className="relative z-10 container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="text-center mb-16"
                    >
                        <motion.div variants={item} className="inline-block mb-4">
                            <div className="inline-flex items-center px-4 py-2 bg-primary-600/30 backdrop-blur-sm rounded-full border border-primary-400/30">
                                <ShieldCheck className="w-5 h-5 mr-2 text-primary-100" />
                                <span className="text-primary-100 font-medium">Trusted Screening Solutions</span>
                            </div>
                        </motion.div>

                        <motion.h1
                            variants={item}
                            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-sligoil mb-6 leading-tight"
                        >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-secondary-400 to-white">
                Advanced Employee Vetting
              </span>
                            <br />
                            For Confident Hiring Decisions
                        </motion.h1>

                        <motion.p
                            variants={item}
                            className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto mb-10"
                        >
                            Darubini Screening delivers comprehensive, compliant background verification services that help organizations mitigate risk and build trustworthy teams.
                        </motion.p>

                        <motion.div
                            variants={item}
                            className="flex flex-col sm:flex-row justify-center gap-4"
                        >
                            <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href="/files/official-darubini-screening-profile.pdf"
                                download
                                className="px-8 py-4 bg-secondary-500 hover:bg-secondary-600 text-white font-medium rounded-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
                            >
                                <FileSearch className="w-5 h-5" />
                                Download Company Profile
                            </motion.a>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 bg-white hover:bg-gray-100 text-primary-700 font-medium rounded-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
                            >
                                <ShieldCheck className="w-5 h-5" />
                                Request Consultation
                            </motion.button>
                        </motion.div>
                    </motion.div>

                    {/* Services grid */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-6"
                    >
                        {services.map((service, index) => (
                            <motion.div
                                key={index}
                                variants={floatingVariants}
                                animate="float"
                                whileHover={{
                                    y: -10,
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    transition: { duration: 0.3 }
                                }}
                                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:shadow-lg transition-all"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <div className="text-white">
                                        {service.icon}
                                    </div>
                                </div>
                                <h3 className="text-white font-medium">{service.text}</h3>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Trust indicators */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="mt-16 flex flex-wrap justify-center items-center gap-6 text-primary-100"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                                <BadgeCheck className="w-4 h-4 text-white" />
                            </div>
                            <span>ISO 9001 : 2015 Certified</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                                <Globe className="w-4 h-4 text-white" />
                            </div>
                            <span>Global Coverage</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                                <Lock className="w-4 h-4 text-white" />
                            </div>
                            <span>GDPR Compliant</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default ServiceHero;