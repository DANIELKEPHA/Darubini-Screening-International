"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
      <div className="min-h-screen bg-gradient-to-br from-primary-800 to-primary-700 flex flex-col justify-center items-center text-center px-4 sm:px-6 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-secondary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl w-full space-y-12 px-4 z-10">
          <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8"
          >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
            >

              <motion.h1
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-white mb-8 leading-tight tracking-tight font-sligoil"
              >
                Comprehensive
                  <motion.span
                      initial={{ x: -200, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{
                          type: "spring",
                          stiffness: 120,
                          damping: 18,
                          mass: 1,
                          delay: 0.6,
                      }}
                      className="inline-block text-secondary-400"
                  >
                      Background
                  </motion.span>

                  <br />
                Verification Services
              </motion.h1>


              <p className="text-xl text-primary-100 max-w-3xl mx-auto leading-relaxed font-geist">
                Mitigate risks with our industry-leading background checks, employment verification,
                and screening services designed for enterprises and institutions.
              </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-col sm:flex-row justify-center gap-4 pt-4"
            >
              <Button
                  className="h-14 px-8 text-lg bg-secondary-500 hover:bg-secondary-600 rounded-lg transition-all font-geist font-medium"
                  size="lg"
              >
                Request a Demo
              </Button>
              <Button
                  className="h-14 px-8 text-lg bg-transparent hover:bg-primary-800 border-2 border-primary-100 text-primary-100 rounded-lg transition-all font-geist font-medium"
                  variant="outline"
                  size="lg"
              >
                Learn About Our Process
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/*/!* Trust indicators *!/*/}
        {/*<motion.div*/}
        {/*    initial={{ opacity: 0 }}*/}
        {/*    animate={{ opacity: 1 }}*/}
        {/*    transition={{ delay: 1, duration: 0.8 }}*/}
        {/*    className="absolute bottom-12 left-0 right-0 py-6 bg-primary-800/50 backdrop-blur-sm"*/}
        {/*>*/}
        {/*  <div className="max-w-7xl mx-auto px-4">*/}
        {/*    <p className="text-primary-200 mb-4 text-sm uppercase tracking-wider font-geist">*/}
        {/*      Trusted by leading organizations worldwide*/}
        {/*    </p>*/}
        {/*    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-90">*/}
        {/*      {['ACME Corp', 'VeriTrust', 'GlobalSafe', 'InnoSecure', 'Fortis Group'].map((company) => (*/}
        {/*          <div key={company} className="text-xl font-bold text-primary-50 font-geist">*/}
        {/*            {company}*/}
        {/*          </div>*/}
        {/*      ))}*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</motion.div>*/}

        {/*/!* Scroll indicator *!/*/}
        {/*<motion.div*/}
        {/*    initial={{ opacity: 0 }}*/}
        {/*    animate={{ opacity: 1 }}*/}
        {/*    transition={{ delay: 1.5, duration: 0.8 }}*/}
        {/*    className="absolute bottom-4 left-0 right-0 flex justify-center z-10"*/}
        {/*>*/}
        {/*  <div className="flex flex-col items-center">*/}
        {/*    <p className="text-primary-200 text-sm mb-2 font-geist">Explore our services</p>*/}
        {/*    <div className="animate-bounce">*/}
        {/*      <svg*/}
        {/*          className="h-6 w-6 text-primary-100"*/}
        {/*          fill="none"*/}
        {/*          viewBox="0 0 24 24"*/}
        {/*          stroke="currentColor"*/}
        {/*      >*/}
        {/*        <path*/}
        {/*            strokeLinecap="round"*/}
        {/*            strokeLinejoin="round"*/}
        {/*            strokeWidth={2}*/}
        {/*            d="M19 14l-7 7m0 0l-7-7m7 7V3"*/}
        {/*        />*/}
        {/*      </svg>*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</motion.div>*/}
      </div>
  );
};

export default HeroSection;