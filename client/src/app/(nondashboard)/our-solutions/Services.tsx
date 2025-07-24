"use client";

import React, {JSX, useState} from "react";
import { motion } from "framer-motion";
import {
    Fingerprint,
    ShieldCheck,
    BadgeCheck,
    UserCheck,
    FileCheck,
    Search,
    House,
    HandCoins,
    Scale,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

const Services = () => {
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };


    const [isModalOpen, setIsModalOpen] = useState(false);

    const services = [
        {
            title: "Investigation Services",
            icon: <Search className="w-8 h-8" />,
            description: "Qualified investigation services for fraud, corruption, or employee misconduct cases.",
            details: [
                "Fraud and corruption investigation",
                "Conduct and performance investigation",
                "Grievance investigation",
                "Forensic accounting",
                "Financial investigation",
                "Witness interviews",
                "Evidence collection",
                "Asset recovery assistance",
            ],
            fullDescription:
                "Qualified investigation services are crucial for organizations suspected of fraud, corruption, or employee misconduct, enabling them to establish facts and take control of challenging situations. At Darubini we have the skills and experience to help you respond quickly and effectively to these challenges. We are qualified to provide fraud and corruption investigation, conduct and performance investigation, grievance investigation, forensic accounting and financial investigation. Our investigation services assist clients in establishing facts, interviewing witnesses, suspects, and collecting information from records, aiding in recovering stolen assets, making insurance claims, taking disciplinary action, or initiating legal proceedings.",
        },
        {
            title: "Document Verification",
            icon: <FileCheck className="w-8 h-8" />,
            description: "Authenticate identity documents against issuing agency records.",
            details: [
                "Birth and Marriage Certificates",
                "National IDs",
                "Driver Licences",
                "Education Certificates",
                "Passports",
                "Visas",
                "Professional Licenses",
                "Academic Transcripts",
            ],
            fullDescription:
                "Document Verification allows organisations to take information taken from a person's identity document, with their consent, and compare this against the corresponding record of the document issuing agency. It provides a key tool for organisations that are seeking to prevent the enrolment or registration of customers, clients and even staff who may be using fraudulent identities. Identity documents that we verify include: Birth and Marriage Certificates, National IDs, Driver Licences, Education Certificates, Passports, Visas.",
        },
        {
            title: "Vetting & Screening",
            icon: <UserCheck className="w-8 h-8" />,
            description: "Comprehensive background checks for workforce integrity.",
            details: [
                "Employment history verification",
                "Academic qualification checks",
                "Credit history reports",
                "Criminal record checks",
                "Reference interviews",
                "Professional license validation",
                "Social media screening",
                "Ongoing employee monitoring",
            ],
            fullDescription:
                "Employment screening services and background checks are crucial for maintaining workforce integrity and safety. With rising lawsuits, training costs, workplace violence, and theft, pre-employment screening is now a necessity for businesses. Candidates often lie about their employment history or qualifications, leading to wrongful employment. Businesses' background checks vary based on size, industry, and other factors. Darubini offers tools to screen candidates, verify curriculum vitae content, and verify credit, qualifications, driver's licenses, and criminal records. Their complete line of employee screening and vetting services helps businesses protect employees, comply with regulatory and industry requirements, and maintain smooth business operations.",
        },
        {
            title: "Domestic Staff Screening",
            icon: <House className="w-8 h-8" />,
            description: "Thorough checks for household employees.",
            details: [
                "Criminal background checks",
                "Previous employment verification",
                "Character references",
                "Health status confirmation",
                "Right-to-work verification",
                "Personality assessment",
                "Skills validation",
                "Trustworthiness evaluation",
            ],
            fullDescription:
                "Our Domestic Workers tests provide you with necessary information you require to ensure that your domestic help has a clean bill of health before they become part of the household. Domestic workers are individuals hired to work within private homes to clean, cook, provide care to children, the elderly, or disabled individuals. They include stewards, cooks, house helps and nannies as well as others whose jobs involve close contact with members of the family. It is very important to do a background check on your domestic worker to make sure that they are people you can trust to look after your house, family or loved ones. You need to find out as much as you possibly can about this person to ensure safety, dependability and professionalism.",
        },
        {
            title: "Criminal Checks",
            icon: <ShieldCheck className="w-8 h-8" />,
            description: "Comprehensive criminal record screening.",
            details: [
                "National police clearance",
                "International criminal checks",
                "Sex offender registry",
                "Terror watchlist screening",
                "Financial crimes database",
                "Court records search",
                "Global sanctions lists",
                "Continuous monitoring",
            ],
            fullDescription:
                "A criminal record check is a crucial part of a comprehensive employee screening program for organizations. Darubini offers a high-quality service to help organizations make smarter hiring decisions. Employers conduct background screening for various reasons, including the risk of negligent hiring lawsuits, increased security and identity-verification strategies due to terrorist acts, scrutiny of corporate executives and directors due to scandals, and the fear of fraudulent credentials from job applicants. These factors make employers cautious in accepting job applicants' word at face value.",
        },
        {
            title: "Corporate Screening",
            icon: <BadgeCheck className="w-8 h-8" />,
            description: "Enterprise-level employee vetting solutions.",
            details: [
                "Executive background checks",
                "Board member screening",
                "Contractor vetting",
                "Vendor due diligence",
                "Compliance audits",
                "Regulatory screening",
                "Industry-specific checks",
                "Global screening solutions",
            ],
            fullDescription:
                "Pre-employment screening programs can reduce the risk of employee theft, misappropriation, criminal activity, or violence in the workplace, and can also prevent negligent hiring lawsuits. It also helps avoid costly terminations. Reference interviews provide detailed reports of candidates' workplace performance, as described by their former supervisor or manager. Darubini offers a range of pre-employment and continuing-employment screening products and services to help employers make informed decisions and ensure compliance with guidelines. Their staff is experienced in handling sensitive information.",
        },
        {
            title: "Fraud Awareness",
            icon: <Scale className="w-8 h-8" />,
            description: "Training to identify and prevent fraudulent activities.",
            details: [
                "Fraud detection workshops",
                "Anti-corruption training",
                "Whistleblower programs",
                "Risk assessment tools",
                "Compliance frameworks",
                "Case study analysis",
                "Prevention strategies",
                "Reporting mechanisms",
            ],
            fullDescription:
                "Fraud is a global issue affecting economies, businesses, and individuals, including bribery, corruption, identity fraud, counterfeit goods, and Ponzi schemes. It poses a significant threat to organizations and is on the rise. Fraud awareness training is crucial in preventing and controlling fraud by raising awareness among employees. Many fraud and corruption cases are not identified early due to staff's inability to recognize warning signs, reporting suspicions, or confidence in the reporting system or investigation process. Our tailored training course explains different types of fraud, prevention principles, fraud legislation, and real-life cases, while also exploring workplace fraud prevention and tackling.",
        },
        {
            title: "Tenant Screening",
            icon: <HandCoins className="w-8 h-8" />,
            description: "Comprehensive checks for rental property applicants.",
            details: [
                "Credit history analysis",
                "Previous landlord references",
                "Employment verification",
                "Income validation",
                "Criminal background check",
                "Rental payment history",
                "Eviction records search",
                "Risk scoring system",
            ],
            fullDescription:
                "Tenant Screening is an essential process when you’re letting out your Investment property. Knowing exactly who is moving into your property will help you to make an informed decision about the tenants you choose and who better to trust in the Kenya’s market. These checks provide you with all the facts you need to know about a tenant’s background history and credit reports, before you make that vital decision to let. Letting a property to the wrong person, based on inaccurate or wilfully misleading information, could result in potentially high damages to your income, your integrity and your reputation. We provide two levels of service, Basic Profile and Full Profile. Both levels of service include full credit history checks and if you use our Full Profile service employment and income checks, previous letting references and enhanced background checks are included. Our tenant Screening service is accurate and easy to use and will provide you with all the information you need to make informed property letting decisions.",
        },
    ];

    type Service = {
        title: string;
        icon: JSX.Element;
        description: string;
        details: string[];
        fullDescription: string;
    };

    const [selectedService, setSelectedService] = useState<Service | null>(null);

    const handleServiceClick = (service: Service) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };


    return (
        <div className="w-full min-h-screen flex flex-col bg-primary-50">
            <motion.main
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col flex-1"
            >
                {/* Services Grid */}
                <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={{
                            visible: {
                                transition: { staggerChildren: 0.1 },
                            },
                        }}
                        className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
                    >
                        {services.map((service, index) => (
                            <motion.div
                                key={index}
                                variants={fadeIn}
                                whileHover={{ y: -10 }}
                                onClick={() => handleServiceClick(service)}
                                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all cursor-pointer"
                            >
                                <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white text-center">
                                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <div className="text-primary-100">{service.icon}</div>
                                    </div>
                                    <h3 className="text-xl font-bold">{service.title}</h3>
                                    <p className="text-primary-100 mt-2">{service.description}</p>
                                </div>
                                <div className="p-6">
                                    <ul className="space-y-3">
                                        {service.details.map((detail, i) => (
                                            <motion.li
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: 0.1 * i }}
                                                className="flex items-start"
                                            >
                                                <Fingerprint
                                                    className="w-5 h-5 text-primary-500 mt-0.5 mr-2 flex-shrink-0"
                                                />
                                                <span className="text-gray-700 text-sm">{detail}</span>
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </section>

                {/* Modal for Service Details */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="bg-primary-800 border border-primary-700 text-primary-100 rounded-lg max-w-2xl">
                        <DialogHeader className="flex justify-between items-center">
                            <DialogTitle className="text-2xl font-bold">{selectedService?.title}</DialogTitle>

                        </DialogHeader>
                        <DialogDescription className="text-base text-primary-200 mt-4">
                            {selectedService?.fullDescription}
                        </DialogDescription>
                    </DialogContent>
                </Dialog>

                {/* Process Section */}
                <section className="py-16 bg-gradient-to-br from-primary-50 to-white">
                    <div className="container mx-auto px-6 max-w-5xl">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-3xl font-bold text-primary-700 inline-block relative font-sligoil">
                                Our Working Process
                                <span className="absolute bottom-0 left-0 w-full h-1 bg-primary-200 transform translate-y-1"></span>
                            </h2>
                            <p className="mt-4 text-lg text-primary-600 max-w-3xl mx-auto">
                                A systematic approach to ensure thorough and reliable results
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-4 gap-8">
                            {[
                                {
                                    step: "1",
                                    title: "Consultation",
                                    description: "Initial assessment of your needs and objectives",
                                },
                                {
                                    step: "2",
                                    title: "Planning",
                                    description: "Customized investigation strategy development",
                                },
                                {
                                    step: "3",
                                    title: "Execution",
                                    description: "Confidential and professional information gathering",
                                },
                                {
                                    step: "4",
                                    title: "Reporting",
                                    description: "Detailed findings with actionable recommendations",
                                },
                            ].map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white p-6 rounded-xl shadow-md text-center"
                                >
                                    <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                                        {item.step}
                                    </div>
                                    <h3 className="text-xl font-semibold text-primary-800 mb-2">{item.title}</h3>
                                    <p className="text-gray-700">{item.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-primary-700 text-white">
                    <div className="container mx-auto px-6 text-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold font-sligoil mb-6">
                                Ready to Secure Your Organization?
                            </h2>
                            <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-10">
                                Contact our team of experts today to discuss your specific investigation and screening needs.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <motion.a
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    href="/contact"
                                    className="px-8 py-4 bg-secondary-500 hover:bg-secondary-600 text-white font-medium rounded-lg transition-all duration-300 shadow-lg"
                                >
                                    Request Consultation
                                </motion.a>
                                <motion.a
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    href="tel:+254700000000"
                                    className="px-8 py-4 bg-white hover:bg-gray-100 text-primary-700 font-medium rounded-lg transition-all duration-300 shadow-lg"
                                >
                                    Call Our Experts
                                </motion.a>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </motion.main>
        </div>
    );
};

export default Services;