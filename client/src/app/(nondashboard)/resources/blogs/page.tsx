"use client";

import React from "react";

import FooterSection from "@/app/(nondashboard)/landing/FooterSection";
import BlogPage from "@/app/(nondashboard)/resources/blogs/BlogPage";

const SearchPage = () => {
    return (
        <div className="w-full min-h-screen flex flex-col bg-white">
            <main className="flex flex-col flex-1">
                <BlogPage/>
                <FooterSection/>
            </main>
        </div>
    );
};

export default SearchPage;
