import React from "react";
import { motion } from "framer-motion";
import {CheckCircle, Lightbulb, Users, Star, Globe, Handshake, Target, Briefcase, Lock} from "lucide-react";

const Mission = () => {
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Vision & Mission */}
            <motion.section
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                    visible: {
                        transition: { staggerChildren: 0.1 }
                    }
                }}
                className="mb-20 grid md:grid-cols-2 gap-8"
            >
                <motion.div
                    variants={fadeIn}
                    className="bg-gradient-to-br from-primary-600 to-primary-700 text-white p-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <Globe className="w-8 h-8 text-primary-200" />
                        <h2 className="text-3xl font-bold border-b-2 border-primary-300 pb-2">Our Vision</h2>
                    </div>
                    <p className="text-xl leading-relaxed text-primary-100">
                        A Global leader of excellence in Vetting and Screening Services of all employers.
                    </p>
                </motion.div>

                <motion.div
                    variants={fadeIn}
                    className="bg-gradient-to-br from-primary-500 to-primary-600 text-white p-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <Target className="w-8 h-8 text-primary-200" />
                        <h2 className="text-3xl font-bold border-b-2 border-primary-300 pb-2">Our Mission</h2>
                    </div>
                    <p className="text-xl leading-relaxed text-primary-100">
                        We exist to provide high quality Vetting and Screening Services to Employers who are our esteemed clients. We commit to deliver memorable experiences to our Clients, a great environment that fosters growth to our employees, a good return to our shareholders, keep our obligation to the authorities and operate responsibly while supporting the community.
                    </p>
                </motion.div>
            </motion.section>

            {/* Core Values */}
            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mb-20 bg-white p-10 rounded-2xl shadow-sm border border-primary-100"
            >
                <div className="text-center mb-12">
                    <motion.h2
                        initial={{ scale: 0.9 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                        className="text-3xl font-bold text-primary-700 inline-block relative font-sligoil"
                    >
                        Our Core Values
                        <span className="absolute bottom-0 left-0 w-full h-1 bg-primary-200 transform translate-y-1"></span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="mt-4 text-lg text-primary-600 max-w-3xl mx-auto"
                    >
                        The foundational principles that guide every decision and interaction at our company.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        {
                            icon: <Handshake className="w-6 h-6" />,
                            title: "Integrity",
                            desc: "Always being honest, delivering what we promise and walking the talk."
                        },
                        {
                            icon: <Star className="w-6 h-6" />,
                            title: "Excellence",
                            desc: "Good isn’t enough. We must consistently and reliably deliver exceptional services."
                        },
                        {
                            icon: <Users className="w-6 h-6" />,
                            title: "Team Work",
                            desc: "Must be a team player and commit to deliver the team goals. Be flexible, cooperate and compassionate to others."
                        },
                        {
                            icon: <Briefcase className="w-6 h-6" />,
                            title: "Professionalism",
                            desc: "We shall be ethical, courteous and civil in how we conduct ourselves while ensuring we deliver skillfully and competently."
                        },
                        {
                            icon: <Lock className="w-6 h-6" />,
                            title: "Confidentiality",
                            desc: "We always treat our client’s information with the utmost confidentiality, ensuring it's not shared with third parties."
                        }
                    ].map((value, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all border-l-4 border-primary-500 flex flex-col hover:-translate-y-1"
                        >
                            <div className="flex items-center mb-4">
                                <div className="p-2 bg-primary-100 rounded-lg text-primary-600 mr-4">
                                    {value.icon}
                                </div>
                                <h3 className="font-bold text-lg text-primary-800">{value.title}</h3>
                            </div>
                            <p className="text-gray-700 pl-12">{value.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.section>


            {/* Business Focus */}
            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mb-10"
            >
                <div className="text-center mb-12">
                    <motion.h2
                        initial={{ scale: 0.9 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                        className="text-3xl font-bold text-primary-700 inline-block relative font-sligoil"
                    >
                        Our Business Focus
                        <span className="absolute bottom-0 left-0 w-full h-1 bg-primary-200 transform translate-y-1"></span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="mt-4 text-lg text-primary-600 max-w-3xl mx-auto"
                    >
                        Specialized services tailored to meet the needs of discerning property investors
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all"
                    >
                        <h3 className="text-xl font-semibold text-primary-800 mb-4">Our Approach</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            There are several types of background checks that can be conducted on job applicants, including Criminal Record Checks, Credit Checks, Previous Employer Checks, Education Verification, and Driving Records Checks.
                        </p>
                        <p className="text-gray-700 leading-relaxed mb-8">
                            Employers must be cautious when hiring. Conducting thorough background checks offers protection against liabilities resulting from negligent recruitment and helps ensure secure, informed hiring decisions.
                        </p>

                        <h4 className="text-lg font-semibold text-primary-700 mb-2">Why Background Screening Matters</h4>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            In today’s competitive and compliance-driven environment, organizations face increasing pressure to hire trustworthy and qualified individuals. Background screening helps mitigate risks related to fraud, reputational damage, and internal security breaches.
                        </p>
                        <p className="text-gray-700 leading-relaxed mb-8">
                            By verifying the authenticity of a candidate’s history, employers not only safeguard their workplace but also enhance their credibility with stakeholders, clients, and regulatory bodies.
                        </p>

                        <h4 className="text-lg font-semibold text-primary-700 mb-2">Tailored Screening for Every Industry</h4>
                        <p className="text-gray-700 leading-relaxed">
                            We understand that different sectors require different levels of scrutiny. Whether it’s the financial sector, healthcare, education, legal, hospitality, or domestic employment, we customize our vetting procedures to meet each industry's unique compliance standards and risk profiles.
                        </p>
                    </motion.div>


                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="bg-gradient-to-br from-primary-50 to-primary-100 p-8 rounded-2xl shadow-md border border-primary-100 hover:shadow-lg transition-all"
                    >
                        <h3 className="text-xl font-semibold text-primary-800 mb-4">Industries Served</h3>
                        <ul className="space-y-3">
                            {[
                                'Banks and Financial Institutions',
                                'Hotels, Tourism and Hospitality',
                                'Farming and Agribusiness',
                                'Insurance Sales & Marketing',
                                'Healthcare (Hospitals & Pharmaceuticals)',
                                'Security Firms and Legal Sector',
                                'NGOs and Community Development',
                                'Embassies',
                                'Marketing and Media',
                                'Academic Institutions (Universities, Colleges, Schools)',
                                'Energy, Transport & Logistics',
                                'Telecommunication Industry',
                                'Call Centers and Customer Care',
                                'Engineering and OurSolutions',
                                'Trade and Industries',
                                'County Governments',
                                'Internships and Volunteering',
                                'Domestic Workers (House helps, Drivers, Cooks, Cleaners, Gardeners)',
                                'Individuals, Landlords, Tenants, Mpesa Agents',
                            ].map((item, index) => (
                                <motion.li
                                    key={index}
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.03 }}
                                    className="flex items-start"
                                >
                                    <CheckCircle className="w-5 h-5 text-primary-600 mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-gray-800">{item}</span>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

            </motion.section>
        </div>
    );
};

export default Mission;