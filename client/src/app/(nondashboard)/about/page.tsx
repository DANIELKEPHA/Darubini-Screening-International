"use client";

import React from "react";
import { motion } from "framer-motion";
import FooterSection from "@/app/(nondashboard)/landing/FooterSection";
import NewsLetter from "@/components/NewsLetter";
import AboutHero from "@/app/(nondashboard)/about/AboutHero";
import Mission from "@/app/(nondashboard)/about/Mission";
import AboutCards from "@/app/(nondashboard)/about/AboutCards";
import TeamSection from "@/app/(nondashboard)/about/TeamSection";

const AboutPage = () => {
    return (
        <div className="w-full min-h-screen flex flex-col bg-primary-50">
            <motion.main
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col flex-1"
            >
                <AboutHero />
                <AboutCards />
                <Mission />
                <TeamSection/>
                <NewsLetter />
                <FooterSection />
            </motion.main>
        </div>
    );
};

export default AboutPage;