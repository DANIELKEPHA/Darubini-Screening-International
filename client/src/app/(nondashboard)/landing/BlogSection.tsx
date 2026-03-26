"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useGetPublicBlogsQuery } from "@/state/api";
import { Sparkles, ArrowRight, BookOpen, Clock, User } from "lucide-react";

// Define Article interface
interface Article {
    id: number;
    imageSrc: string;
    title: string;
    description: string;
    linkHref: string;
    tags: string[];
    date: string;
    readTime: string;
}

// 3D Tilt Effect Component
const TiltCard = ({ children }: { children: React.ReactNode }) => {
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    return (
        <motion.div
            onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                setTilt({ x: (x - 0.5) * 20, y: (y - 0.5) * 20 });
            }}
            onMouseLeave={() => setTilt({ x: 0, y: 0 })}
            animate={{
                rotateX: tilt.y * -1,
                rotateY: tilt.x,
                transition: { type: "spring", damping: 15, stiffness: 200 }
            }}
            style={{
                transformStyle: "preserve-3d",
                transformPerspective: 1000
            }}
        >
            {children}
        </motion.div>
    );
};

// Glass Morphism Panel
const GlassPanel = ({ children }: { children: React.ReactNode }) => (
    <div className="relative">
        <div className="absolute inset-0 bg-white/30 backdrop-blur-lg rounded-2xl" />
        <div className="relative z-10">{children}</div>
    </div>
);

const BlogSection = () => {
    const { data: blogsData, isLoading, error } = useGetPublicBlogsQuery({
        page: 1,
        limit: 6,
        search: "",
        tag: ""
    });

    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState(0); // 0: none, 1: right, -1: left

    const articles: Article[] = blogsData?.data?.map(blog => ({
        id: blog.id,
        imageSrc: blog.coverImageSignedUrl || "/default-blog-image.jpg",
        title: blog.title,
        description: blog.excerpt || blog.content.substring(0, 160) + "...",
        linkHref: `/resources/blogs/${blog.slug}`,
        tags: blog.tags || [], // Ensure tags is always an array
        date: new Date(blog.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        }),
        readTime: Math.ceil(blog.content.length / 1000) + " min read"
    })) || [];

    // Auto-rotate featured articles
    useEffect(() => {
        if (articles.length <= 1) return;
        const interval = setInterval(() => {
            setDirection(1);
            setActiveIndex(prev => (prev + 1) % articles.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [articles.length]);

    const handlePrev = () => {
        setDirection(-1);
        setActiveIndex(prev => (prev === 0 ? articles.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setDirection(1);
        setActiveIndex(prev => (prev + 1) % articles.length);
    };

    if (isLoading) {
        return (
            <section className="relative py-28 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <div className="h-12 w-48 bg-gray-200 rounded-full mx-auto mb-6" />
                        <div className="h-6 w-64 bg-gray-200 rounded-full mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-[500px] bg-gray-100 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (error || !articles.length) {
        return (
            <section className="relative py-28 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <Sparkles className="h-12 w-12 text-primary-500 mx-auto mb-6" />
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Fresh Content Coming Soon</h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Our experts are preparing new insights on screening and compliance best practices.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="relative py-28 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
            {/* Floating decorative elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
            <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-gray-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 text-primary-600 mb-6"
                    >
                        <Sparkles className="h-5 w-5 mr-2" />
                        <span>Latest Insights</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="text-5xl font-bold text-gray-900 mb-6"
                    >
                        Elevate Your Hiring Strategy
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        viewport={{ once: true }}
                        className="text-xl text-gray-600 max-w-3xl mx-auto"
                    >
                        Discover cutting-edge techniques and compliance updates from our screening experts
                    </motion.p>
                </div>

                {/* Featured Article (Large) */}
                {articles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        viewport={{ once: true }}
                        className="mb-20"
                    >
                        <GlassPanel>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-1">
                                <div className="relative rounded-xl overflow-hidden">
                                    <Image
                                        src={articles[activeIndex].imageSrc}
                                        alt={articles[activeIndex].title}
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                                    <div className="absolute bottom-0 left-0 p-8 text-white z-10">
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {articles[activeIndex].tags.slice(0, 3).map((tag: string) => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-800 backdrop-blur-sm"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <h3 className="text-3xl font-bold mb-4">
                                            {articles[activeIndex].title}
                                        </h3>
                                        <div className="flex items-center space-x-4 text-sm">
                                            <span className="flex items-center">
                                                <Clock className="h-4 w-4 mr-1" />
                                                {articles[activeIndex].readTime}
                                            </span>
                                            <span className="flex items-center">
                                                <User className="h-4 w-4 mr-1" />
                                                By A Darubini Member
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 flex flex-col">
                                    <p className="text-gray-600 text-lg mb-8 flex-grow">
                                        {articles[activeIndex].description}
                                    </p>
                                    <Link
                                        href={articles[activeIndex].linkHref}
                                        className="group inline-flex items-center text-primary-600 font-medium"
                                    >
                                        Read Full Analysis
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            </div>
                        </GlassPanel>
                        {articles.length > 1 && (
                            <div className="flex justify-center mt-8 space-x-4">
                                <button
                                    onClick={handlePrev}
                                    className="p-3 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors"
                                    aria-label="Previous article"
                                >
                                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <div className="flex items-center space-x-2">
                                    {articles.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setActiveIndex(index)}
                                            className={`h-2 rounded-full transition-all duration-300 ${index === activeIndex ? 'w-8 bg-primary-500' : 'w-4 bg-gray-300'}`}
                                            aria-label={`Go to article ${index + 1}`}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={handleNext}
                                    className="p-3 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors"
                                    aria-label="Next article"
                                >
                                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Article Grid */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {articles.slice(0, 3).map((article, index) => (
                        <TiltCard key={article.id}>
                            <motion.div
                                whileHover={{ y: -8 }}
                                className="h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 flex flex-col"
                            >
                                <div className="relative aspect-video overflow-hidden">
                                    <Image
                                        src={article.imageSrc}
                                        alt={article.title}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-800">
                                        {article.tags[0] || "Article"}
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="flex items-center text-sm text-gray-500 mb-3">
                                        <span>{article.date}</span>
                                        <span className="mx-2">•</span>
                                        <span>{article.readTime}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{article.title}</h3>
                                    <p className="text-gray-600 mb-6 flex-grow">{article.description}</p>
                                    <Link
                                        href={article.linkHref}
                                        className="group inline-flex items-center text-primary-600 font-medium"
                                    >
                                        Continue Reading
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            </motion.div>
                        </TiltCard>
                    ))}
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1 }}
                    viewport={{ once: true }}
                    className="mt-20 text-center"
                >
                    <Link
                        href="/resources/blogs"
                        className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        <BookOpen className="mr-3 h-5 w-5" />
                        Explore All Articles
                    </Link>
                    <p className="mt-4 text-gray-500">Stay updated with our latest research and insights</p>
                </motion.div>
            </div>
        </section>
    );
};

export default BlogSection;