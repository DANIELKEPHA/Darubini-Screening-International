"use client";

import React from "react";

import FooterSection from "@/app/(nondashboard)/landing/FooterSection";
import NewsLetter from "@/components/NewsLetter";
import ServiceHero from "@/app/(nondashboard)/our-solutions/ServiceHero";
import Services from "@/app/(nondashboard)/our-solutions/Services";

const SearchPage = () => {
    return (
        <div className="w-full min-h-screen flex flex-col bg-white">
            <main className="flex flex-col flex-1">
                <ServiceHero/>
                <Services/>
                <NewsLetter/>
                <FooterSection/>
            </main>
        </div>
    );
};

export default SearchPage;
