import React from "react";
import HeroSection from "./HeroSection";
import CallToActionSection from "./CallToActionSection";
import FooterSection from "./FooterSection";
import NewsLetter from "@/components/NewsLetter";
import MissionSection from "@/app/(nondashboard)/landing/MissionSection";
import ServicesSection from "@/app/(nondashboard)/landing/ServicesSection";
import BlogSection from "./BlogSection";

const Landing = () => {
  return (
    <div>
      <HeroSection />
      <MissionSection/>
      <ServicesSection/>
      <BlogSection />
      <CallToActionSection />
      <NewsLetter/>
      <FooterSection />
    </div>
  );
};

export default Landing;
