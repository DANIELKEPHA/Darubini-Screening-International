"use client";
import React from "react";
import { motion } from "framer-motion";
import {
    Search,
    Clock,
    UserCheck,
    ShieldCheck,
    ArrowRight,
    Calendar,
    User
} from "lucide-react";

const BlogPage = () => {
    const featuredPosts = [
        {
            id: 1,
            title: "The Evolution of Employee Background Checks in the Digital Age",
            excerpt: "How technology is transforming the way organizations verify candidate histories and credentials.",
            category: "Industry Trends",
            date: "May 15, 2023",
            readTime: "5 min read",
            image: "/background-checks-evolution.jpg"
        },
        {
            id: 2,
            title: "Mitigating Hiring Risks: Best Practices for Comprehensive Screening",
            excerpt: "Essential strategies to protect your organization from negligent hiring claims and workplace incidents.",
            category: "Best Practices",
            date: "April 28, 2023",
            readTime: "7 min read",
            image: "/hiring-risks-mitigation.jpg"
        }
    ];

    const blogPosts = [
        {
            id: 3,
            title: "Understanding Global Background Check Regulations",
            excerpt: "Navigating the complex landscape of international screening compliance requirements.",
            category: "Compliance",
            date: "April 10, 2023",
            readTime: "6 min read",
            image: "/global-regulations.jpg"
        },
        {
            id: 4,
            title: "The Role of AI in Modern Background Screening",
            excerpt: "How artificial intelligence is improving accuracy and efficiency in candidate vetting processes.",
            category: "Technology",
            date: "March 22, 2023",
            readTime: "4 min read",
            image: "/ai-screening.jpg"
        },
        {
            id: 5,
            title: "Social Media Screening: Ethical Considerations",
            excerpt: "Balancing privacy concerns with organizational security needs in digital footprint analysis.",
            category: "Ethics",
            date: "March 15, 2023",
            readTime: "5 min read",
            image: "/social-media-screening.jpg"
        },
        {
            id: 6,
            title: "Criminal Record Checks: What Employers Need to Know",
            excerpt: "A comprehensive guide to legally compliant criminal history verification.",
            category: "Compliance",
            date: "February 28, 2023",
            readTime: "8 min read",
            image: "/criminal-checks.jpg"
        },
        {
            id: 7,
            title: "Educational Verification in the Era of Diploma Mills",
            excerpt: "Detecting and preventing academic credential fraud in your hiring process.",
            category: "Verification",
            date: "February 15, 2023",
            readTime: "5 min read",
            image: "/education-verification.jpg"
        },
        {
            id: 8,
            title: "Continuous Monitoring vs. Traditional Background Checks",
            excerpt: "Comparing periodic screening with ongoing employee monitoring solutions.",
            category: "Innovation",
            date: "January 30, 2023",
            readTime: "6 min read",
            image: "/continuous-monitoring.jpg"
        }
    ];

    const trendingTopics = [
        "FCRA Compliance Updates",
        "Remote Workforce Screening",
        "Identity Verification Tech",
        "Global Screening Challenges",
        "Healthcare Sector Vetting",
        "Gig Economy Background Checks"
    ];

    return (
        <div className="w-full min-h-screen flex flex-col bg-white">
            <motion.main
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col flex-1"
            >

                {/* Hero Section */}
                <section className="bg-primary-50 py-16">
                    <div className="container mx-auto px-6 max-w-7xl">
                        <div className="max-w-3xl mx-auto text-center">
                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.6 }}
                                className="text-4xl md:text-5xl font-bold text-primary-800 font-sligoil mb-6"
                            >
                                Insights on Background Screening & Employee Vetting
                            </motion.h1>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="text-xl text-primary-600 mb-10"
                            >
                                Expert perspectives on compliance, technology, and best practices in the screening industry
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="relative max-w-xl mx-auto"
                            >
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-primary-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search articles..."
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                                />
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Featured Posts */}
                <section className="py-16 bg-white">
                    <div className="container mx-auto px-6 max-w-7xl">
                        <motion.h2
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-2xl font-bold text-primary-800 mb-10 font-sligoil"
                        >
                            Featured Articles
                        </motion.h2>
                        <div className="grid md:grid-cols-2 gap-10">
                            {featuredPosts.map((post) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5 }}
                                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all"
                                >
                                    <div className="h-64 bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden">
                                        <img
                                            src={post.image}
                                            alt={post.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = '/placeholder-blog.jpg';
                                            }}
                                        />
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center gap-4 mb-3">
                      <span className="text-xs font-semibold px-3 py-1 bg-primary-100 text-primary-800 rounded-full">
                        {post.category}
                      </span>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                {post.date}
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-primary-800 mb-2">{post.title}</h3>
                                        <p className="text-gray-600 mb-4">{post.excerpt}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Clock className="w-4 h-4 mr-1" />
                                                {post.readTime}
                                            </div>
                                            <button className="text-secondary-500 hover:text-secondary-600 font-medium flex items-center">
                                                Read more <ArrowRight className="w-4 h-4 ml-1" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* All Articles */}
                <section className="py-16 bg-gray-50">
                    <div className="container mx-auto px-6 max-w-7xl">
                        <div className="flex flex-col md:flex-row gap-10">
                            <div className="md:w-2/3">
                                <motion.h2
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    className="text-2xl font-bold text-primary-800 mb-10 font-sligoil"
                                >
                                    Latest Articles
                                </motion.h2>
                                <div className="grid md:grid-cols-2 gap-8">
                                    {blogPosts.map((post) => (
                                        <motion.div
                                            key={post.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.5 }}
                                            className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all"
                                        >
                                            <div className="h-48 bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
                                                <img
                                                    src={post.image}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.src = '/placeholder-blog.jpg';
                                                    }}
                                                />
                                            </div>
                                            <div className="p-6">
                                                <div className="flex items-center gap-4 mb-3">
                          <span className="text-xs font-semibold px-3 py-1 bg-primary-100 text-primary-800 rounded-full">
                            {post.category}
                          </span>
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {post.date}
                                                    </div>
                                                </div>
                                                <h3 className="text-lg font-bold text-primary-800 mb-2">{post.title}</h3>
                                                <p className="text-gray-600 text-sm mb-4">{post.excerpt}</p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {post.readTime}
                                                    </div>
                                                    <button className="text-secondary-500 hover:text-secondary-600 text-sm font-medium flex items-center">
                                                        Read more <ArrowRight className="w-3 h-3 ml-1" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                <div className="mt-12 flex justify-center">
                                    <button className="px-6 py-3 bg-primary-700 hover:bg-primary-800 text-white font-medium rounded-lg shadow-md transition-all">
                                        Load More Articles
                                    </button>
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="md:w-1/3">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-white p-6 rounded-lg shadow-sm mb-8"
                                >
                                    <h3 className="text-lg font-bold text-primary-800 mb-4 flex items-center">
                                        <UserCheck className="w-5 h-5 mr-2 text-secondary-500" />
                                        About The Author
                                    </h3>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 rounded-full bg-primary-100 overflow-hidden">
                                            <img
                                                src="/author-profile.jpg"
                                                alt="Author"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.src = '/placeholder-profile.jpg';
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-primary-800">James Karanja</h4>
                                            <p className="text-sm text-gray-600">Head of Screening Operations</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm">
                                        With over 15 years in background screening and compliance, James provides expert insights on employee vetting best practices.
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-white p-6 rounded-lg shadow-sm mb-8"
                                >
                                    <h3 className="text-lg font-bold text-primary-800 mb-4 flex items-center">
                                        <ShieldCheck className="w-5 h-5 mr-2 text-secondary-500" />
                                        Trending Topics
                                    </h3>
                                    <div className="space-y-3">
                                        {trendingTopics.map((topic, index) => (
                                            <a
                                                key={index}
                                                href="#"
                                                className="block px-3 py-2 bg-primary-50 hover:bg-primary-100 rounded-lg text-primary-800 text-sm font-medium transition-all"
                                            >
                                                {topic}
                                            </a>
                                        ))}
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.6 }}
                                    className="bg-gradient-to-br from-primary-700 to-primary-800 p-6 rounded-lg shadow-sm text-white"
                                >
                                    <h3 className="text-lg font-bold mb-4">Subscribe to Our Newsletter</h3>
                                    <p className="text-primary-100 mb-4 text-sm">
                                        Get the latest screening industry insights delivered to your inbox.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="email"
                                            placeholder="Your email address"
                                            className="flex-1 px-4 py-2 rounded-lg border border-primary-600 bg-primary-800/50 text-white placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-secondary-500"
                                        />
                                        <button className="px-4 py-2 bg-secondary-500 hover:bg-secondary-600 text-primary-800 font-medium rounded-lg shadow-sm transition-all">
                                            Subscribe
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>

            </motion.main>
        </div>
    );
};

export default BlogPage;