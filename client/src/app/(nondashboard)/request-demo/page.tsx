import React from "react";
import NewsLetter from "@/components/NewsLetter";
import ChatWidget from "@/app/(nondashboard)/landing/ChatWidget";
import FooterSection from "@/app/(nondashboard)/landing/FooterSection";
import RequestDemoPage from "@/app/(nondashboard)/request-demo/RequestDemoPage";

const Landing = () => {
    return (
        <>
            <div>
                <RequestDemoPage/>
                <NewsLetter />
                <FooterSection />
            </div>

            {/* Floating chat button (bottom-right) */}
            <ChatWidget />
        </>
    );
};

export default Landing;
