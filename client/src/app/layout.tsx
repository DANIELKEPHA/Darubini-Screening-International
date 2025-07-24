import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";

// Load Geist Sans and Mono fonts
const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

// Load Sligoil font from public/fonts/Sligoil
const sligoilMicro = localFont({
    src: [
        {
            path: "../../public/fonts/Sligoil/Sligoil-Micro.woff2",
            weight: "400",
            style: "normal",
        },
        {
            path: "../../public/fonts/Sligoil/Sligoil-MicroMedium.woff2",
            weight: "500",
            style: "normal",
        },
        {
            path: "../../public/fonts/Sligoil/Sligoil-MicroBold.woff2",
            weight: "700",
            style: "normal",
        },
    ],
    variable: "--font-sligoil",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Darubini Screening International Company",
    description:
        "We focus in verifying candidates' qualifications, credentials, and history, including employment history, criminal records, education, and other relevant details.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <head>
            {/* Preload fonts for performance */}
            <link
                rel="preload"
                href="/fonts/Sligoil/Sligoil-Micro.woff2"
                as="font"
                type="font/woff2"
                crossOrigin="anonymous"
            />
            <link
                rel="preload"
                href="/fonts/Sligoil/Sligoil-MicroMedium.woff2"
                as="font"
                type="font/woff2"
                crossOrigin="anonymous"
            />
            <link
                rel="preload"
                href="/fonts/Sligoil/Sligoil-MicroBold.woff2"
                as="font"
                type="font/woff2"
                crossOrigin="anonymous"
            />
        </head>
        <body
            className={`${geistSans.variable} ${geistMono.variable} ${sligoilMicro.variable} antialiased font-geist`}
        >
        <Providers>{children}</Providers>
        <Toaster closeButton />
        </body>
        </html>
    );
}