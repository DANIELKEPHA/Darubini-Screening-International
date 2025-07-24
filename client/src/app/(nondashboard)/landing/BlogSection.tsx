"use client";

import React, { useState, useEffect } from "react";
import { Easing, easeOut, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as Easing,
    }
  }
};

const cardHoverVariants = {
  hover: {
    y: -8,
    transition: {
      duration: 0.3,
      ease: easeOut,
    },
  },
};

const buttonVariants = {
  hover: {
    scale: 1.05,
    boxShadow: "0 10px 25px -5px rgba(141, 24, 44, 0.3)",
    transition: {
      duration: 0.2
    }
  },
  tap: {
    scale: 0.98
  }
};

const articles = [
  {
    imageSrc: "/background-check.jpg",
    title: "The Complete Guide to Employment Background Checks",
    description: "Learn what employers look for in background checks and how to ensure compliance with FCRA regulations.",
    linkText: "Read Article",
    linkHref: "/blog/background-checks",
    gradient: "from-primary-500 to-primary-600",
    category: "Compliance"
  },
  {
    imageSrc: "/screening-tech.jpg",
    title: "How AI is Transforming Candidate Screening",
    description: "Discover how artificial intelligence is revolutionizing the hiring process while maintaining fairness and reducing bias.",
    linkText: "Read Article",
    linkHref: "/blog/ai-screening",
    gradient: "from-primary-500 to-secondary-500",
    category: "Technology"
  },
  {
    imageSrc: "/compliance.jpg",
    title: "Navigating Global Screening Regulations",
    description: "Understand the complex landscape of international employment screening laws and best practices.",
    linkText: "Read Article",
    linkHref: "/blog/global-compliance",
    gradient: "from-primary-600 to-primary-700",
    category: "Compliance"
  },
  {
    imageSrc: "/risk-management.jpg",
    title: "Mitigating Hiring Risks in High-Turnover Industries",
    description: "Strategies for reducing risk and improving retention through effective pre-employment screening.",
    linkText: "Read Article",
    linkHref: "/blog/risk-management",
    gradient: "from-secondary-500 to-secondary-600",
    category: "Risk Management"
  },
  {
    imageSrc: "/continuous-monitoring.jpg",
    title: "The Case for Continuous Employee Monitoring",
    description: "Why post-hire monitoring is becoming essential for maintaining workplace safety and compliance.",
    linkText: "Read Article",
    linkHref: "/blog/continuous-monitoring",
    gradient: "from-primary-500 to-primary-700",
    category: "Best Practices"
  }
];

const BlogSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prevIndex) => (prevIndex + 1) % (articles.length - 2));
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) =>
        prevIndex === 0 ? articles.length - 3 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) =>
        prevIndex === articles.length - 3 ? 0 : prevIndex + 1
    );
  };

  const displayedArticles = articles.slice(currentIndex, currentIndex + 3);

  return (
      <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary-50 to-white relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
                variants={itemVariants}
                className="text-4xl font-bold text-gray-900 text-center"
            >
              Screening & Background Check Insights
            </motion.h2>
            <motion.p
                variants={itemVariants}
                className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Expert analysis on hiring compliance, risk management, and screening technology
            </motion.p>
          </div>

          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {displayedArticles.map((article, index) => (
                  <motion.div
                      key={`${currentIndex}-${index}`}
                      custom={direction}
                      initial={{ opacity: 0, x: direction * 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -direction * 40 }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full relative"
                  >
                    <ArticleCard {...article} />

                    {index < displayedArticles.length - 1 && (
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 + index * 0.3 }}
                            className="hidden md:block absolute top-1/2 right-[-1.5rem] w-12 h-1 bg-gradient-to-br from-primary-500 to-secondary-500 origin-left"
                        />
                    )}
                  </motion.div>
              ))}
            </div>

            <div className="flex justify-center mt-12 space-x-4">
              <motion.button
                  onClick={handlePrev}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="p-3 rounded-full bg-white shadow-md text-primary-500 hover:bg-primary-50 transition-colors"
                  aria-label="Previous articles"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
              <motion.button
                  onClick={handleNext}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="p-3 rounded-full bg-white shadow-md text-primary-500 hover:bg-primary-50 transition-colors"
                  aria-label="Next articles"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </div>
          </div>

          <div className="mt-16 text-center">
            <motion.div variants={itemVariants}>
              <Link
                  href="/blog"
                  className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-primary-500 hover:bg-primary-600 transition-all duration-200 shadow-md hover:shadow-lg"
                  scroll={false}
              >
                View All Articles
                <svg className="ml-3 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>
  );
};

const ArticleCard = ({
                       imageSrc,
                       title,
                       description,
                       linkText,
                       linkHref,
                       gradient,
                       category
                     }: {
  imageSrc: string;
  title: string;
  description: string;
  linkText: string;
  linkHref: string;
  gradient: string;
  category: string;
}) => (
    <motion.div
        variants={cardHoverVariants}
        whileHover="hover"
        className="h-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      <div className={`h-48 bg-gradient-to-r ${gradient} relative overflow-hidden`}>
        <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover mix-blend-multiply opacity-90"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-800">
          {category}
        </div>
      </div>
      <div className="p-8 flex flex-col flex-grow">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-600 mb-6 flex-grow">{description}</p>
        <Link
            href={linkHref}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-500 hover:bg-primary-600 transition-all duration-200 shadow-md hover:shadow-lg"
            scroll={false}
        >
          {linkText}
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </motion.div>
);

export default BlogSection;