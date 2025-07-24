"use client";

import React from "react";

import FooterSection from "@/app/(nondashboard)/landing/FooterSection";
import NewsLetter from "@/components/NewsLetter";
import BlogPage from "@/app/(nondashboard)/resources/blogs/BlogPage";
import BreadCrumb from "@/components/BreadCrumb";

const SearchPage = () => {
    return (
        <div className="w-full min-h-screen flex flex-col bg-white">
            <main className="flex flex-col flex-1">
                <BreadCrumb
                    items={[
                        { label: 'Home', href: '/' },
                        { label: 'Resources', href: '/resources' },
                        { label: 'Blog', href: '/blog' },

                    ]}
                />
                <BlogPage/>
                <NewsLetter/>
                <FooterSection/>
            </main>
        </div>
    );
};

export default SearchPage;
