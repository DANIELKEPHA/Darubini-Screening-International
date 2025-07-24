"use client";

import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const CallToActionSection = () => {
  return (
      <section className="relative py-28 lg:py-36 overflow-hidden">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0">
          <Image
              src="/screening-call-to-action.png"
              alt="screening-call-to-action"
              fill
              className="object-cover object-center"
              priority
              quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-primary-700/70"></div>
        </div>

        {/* Content */}
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
            className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-6 text-center lg:text-left">
              <motion.h2
                  className="text-4xl md:text-5xl font-bold text-white leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
              >
                Make Confident <span className="text-primary-400">Hiring Decisions</span>
              </motion.h2>

              <motion.p
                  className="text-xl text-gray-200 max-w-lg mx-auto lg:mx-0"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  viewport={{ once: true }}
              >
                Access trusted background checks, employee verification, and compliance insights—faster and easier than ever.
              </motion.p>
            </div>

            {/* CTA Buttons */}
            <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                viewport={{ once: true }}
            >
              <Link
                  href="/services"
                  className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl text-center"
              >
                Explore Services
              </Link>

              <Link
                  href="/contact"
                  className="px-8 py-4 bg-transparent border-2 border-white hover:bg-white/10 text-white font-semibold rounded-lg transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl text-center"
              >
                Talk to an Expert
              </Link>
            </motion.div>
          </div>

          {/* Trust Indicators */}
          <motion.div
              className="mt-16 pt-8 border-t border-white/20 flex flex-col md:flex-row justify-center items-center gap-6 text-white/80"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              viewport={{ once: true }}
          >
            <div className="flex flex-wrap items-center gap-4 md:gap-6">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-primary-400">10K+</div>
                <div>Screenings Completed</div>
              </div>
              <div className="hidden md:block h-6 w-px bg-white/30"></div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-primary-400">98%</div>
                <div>Client Satisfaction</div>
              </div>
              <div className="hidden md:block h-6 w-px bg-white/30"></div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-primary-400">24/7</div>
                <div>Secure Access</div>
              </div>
              <div className="hidden md:block h-6 w-px bg-white/30"></div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-primary-400">ISO</div>
                <div>9001 : 2015 Certified</div>
              </div>
            </div>

          </motion.div>
        </motion.div>
      </section>
  );
};

export default CallToActionSection;
