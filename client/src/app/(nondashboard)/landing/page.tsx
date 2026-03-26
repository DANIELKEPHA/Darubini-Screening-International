import React from "react";
import HeroSection from "./HeroSection";
import CallToActionSection from "./CallToActionSection";
import FooterSection from "./FooterSection";
import NewsLetter from "@/components/NewsLetter";
import MissionSection from "@/app/(nondashboard)/landing/MissionSection";
import ServicesSection from "@/app/(nondashboard)/landing/ServicesSection";
import BlogSection from "./BlogSection";
import ChatWidget from "@/app/(nondashboard)/landing/ChatWidget";
import WorkflowAnimation from "@/app/(nondashboard)/landing/ProcessAnimation";

const Landing = () => {
    return (
        <>
            <div>
                <HeroSection />
                <WorkflowAnimation/>
                <MissionSection />
                <ServicesSection />
                <BlogSection />
                <CallToActionSection />
                <NewsLetter />
                <FooterSection />
            </div>

            {/* Floating chat button (bottom-right) */}
            <ChatWidget />
        </>
    );
};

export default Landing;
