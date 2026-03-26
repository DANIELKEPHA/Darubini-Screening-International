'use client';

import React from 'react';
import Policy from "@/app/(nondashboard)/privacyPolicy/Policy";
import FooterSection from '@/app/(nondashboard)/landing/FooterSection';
import NewsLetter from "@/components/NewsLetter";
import BreadCrumb from "@/components/BreadCrumb";
import CookieConsent from '@/app/(nondashboard)/privacyPolicy/CookieConsent';

const Page = () => {
    return (
        <div className="w-full min-h-screen flex flex-col bg-gray-50">
            <main className="flex-1">
                <BreadCrumb
                    items={[
                        { label: 'Home', href: '/' },
                        { label: 'Privacy Policy', href: '/policy' },

                    ]}
                />
                <Policy />
                <NewsLetter />
                <FooterSection />
            </main>
            <CookieConsent />
        </div>
    );
};

export default Page;