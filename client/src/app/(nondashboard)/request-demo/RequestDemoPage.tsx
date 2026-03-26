"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import Image from "next/image";

const RequestDemoPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-800 to-primary-700 flex">
            {/* Image Section - 50% width with no padding/gaps */}
            <div className="w-1/2 relative">
                <Image
                    src="/demo-image.jpg"
                    alt="Darubini Screening Demo"
                    fill
                    className="object-cover"
                    priority
                />
                {/* Text overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-black/30">
                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-5xl sm:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight font-sligoil"
                    >
                        See Darubini Screening <span className="text-secondary-400">In Action</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                        className="text-xl text-primary-100 max-w-2xl leading-relaxed font-geist"
                    >
                        Schedule a personalized demo to see how we can streamline your background checks and reduce hiring risks
                    </motion.p>
                </div>
            </div>

            {/* Form Section - 50% width with no rounded corners */}
            <div className="w-1/2 bg-white/10 backdrop-blur-lg p-12 flex flex-col justify-center">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    <h2 className="text-3xl font-bold text-white mb-8 font-sligoil">Request a Consultation</h2>

                    <form className="space-y-6 text-left">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="firstName" className="block text-primary-100 mb-2 font-geist">First Name</label>
                                <Input
                                    id="firstName"
                                    type="text"
                                    className="bg-white/5 border-white/20 text-white h-14"
                                    placeholder="John"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-primary-100 mb-2 font-geist">Last Name</label>
                                <Input
                                    id="lastName"
                                    type="text"
                                    className="bg-white/5 border-white/20 text-white h-14"
                                    placeholder="Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="company" className="block text-primary-100 mb-2 font-geist">Company Name</label>
                                <Input
                                    id="company"
                                    type="text"
                                    className="bg-white/5 border-white/20 text-white h-14"
                                    placeholder="Acme Inc."
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="jobTitle" className="block text-primary-100 mb-2 font-geist">Job Title</label>
                                <Input
                                    id="jobTitle"
                                    type="text"
                                    className="bg-white/5 border-white/20 text-white h-14"
                                    placeholder="HR Director"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="industry" className="block text-primary-100 mb-2 font-geist">Industry</label>
                            <Select>
                                <SelectTrigger className="bg-white/5 border-white/20 text-white h-14">
                                    <SelectValue placeholder="Select industry" />
                                </SelectTrigger>
                                <SelectContent className="bg-primary-800 border-white/20 text-white">
                                    <SelectItem value="tech">Technology</SelectItem>
                                    <SelectItem value="healthcare">Healthcare</SelectItem>
                                    <SelectItem value="finance">Finance</SelectItem>
                                    <SelectItem value="education">Education</SelectItem>
                                    <SelectItem value="retail">Retail</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="email" className="block text-primary-100 mb-2 font-geist">Email</label>
                                <Input
                                    id="email"
                                    type="email"
                                    className="bg-white/5 border-white/20 text-white h-14"
                                    placeholder="john@company.com"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-primary-100 mb-2 font-geist">Phone</label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    className="bg-white/5 border-white/20 text-white h-14"
                                    placeholder="+2547 123-4567-89"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="needs" className="block text-primary-100 mb-2 font-geist">How can we help?</label>
                            <Textarea
                                id="needs"
                                className="bg-white/5 border-white/20 text-white min-h-32"
                                placeholder="Tell us about your verification needs and challenges..."
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 text-lg bg-secondary-500 hover:bg-secondary-600 rounded-lg transition-all font-geist font-medium mt-6"
                            size="lg"
                        >
                            Schedule My Demo
                        </Button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default RequestDemoPage;