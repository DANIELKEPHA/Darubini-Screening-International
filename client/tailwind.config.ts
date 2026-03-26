import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: ["class"],
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "rgb(141, 24, 44)",
                    50: "#fdf7f8",
                    100: "#fbecef",
                    200: "#f5ccd1",
                    300: "#e79ba3",
                    400: "#d75c68",
                    500: "rgb(141, 24, 44)",
                    600: "#720818",
                    700: "#4c050f",
                    800: "#290306",
                    900: "#170102",
                },
                secondary: {
                    DEFAULT: "#D9911E",
                    50: "#fffaf0",
                    100: "#fcefdc",
                    200: "#f8daae",
                    300: "#f2bc6e",
                    400: "#ed9e2e",
                    500: "#D9911E",
                    600: "#ab7016",
                    700: "#804f10",
                    800: "#553109",
                    900: "#2b1804",
                },
                // Retain HSL CSS variables support
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                chart: {
                    "1": "hsl(var(--chart-1))",
                    "2": "hsl(var(--chart-2))",
                    "3": "hsl(var(--chart-3))",
                    "4": "hsl(var(--chart-4))",
                    "5": "hsl(var(--chart-5))",
                },
                sidebar: {
                    DEFAULT: "hsl(var(--sidebar-background))",
                    foreground: "hsl(var(--sidebar-foreground))",
                    primary: "hsl(var(--sidebar-primary))",
                    "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
                    accent: "hsl(var(--sidebar-accent))",
                    "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
                    border: "hsl(var(--sidebar-border))",
                    ring: "hsl(var(--sidebar-ring))",
                },
            },
            fontFamily: {
                sligoil: ['var(--font-sligoil)', 'sans-serif'],
                geist: ['var(--font-geist-sans)', 'sans-serif'],
                'geist-mono': ['var(--font-geist-mono)', 'monospace'],
                // Add handwriting font for sticky notes
                'caveat': ['"Caveat"', 'cursive'],
                // Optional: Add more handwriting fonts for variety
                'handwriting': ['"Caveat"', '"Comic Neue"', 'cursive'],
                'typewriter': ['"Courier Prime"', 'monospace'],
            },
            // Add custom animations
            animation: {
                'pulse-gentle': 'pulse-gentle 2s ease-in-out infinite',
                'float': 'float 6s ease-in-out infinite',
                'sticky-appear': 'sticky-appear 0.5s ease-out',
                'sticky-disappear': 'sticky-disappear 0.5s ease-in',
                'wiggle': 'wiggle 1s ease-in-out infinite',
                'flip': 'flip 0.6s ease-in-out',
                'bounce-gentle': 'bounce-gentle 0.5s ease-in-out',
                'paper-crumple': 'paper-crumple 0.8s ease-out',
            },
            // Add custom keyframes
            keyframes: {
                'pulse-gentle': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                'sticky-appear': {
                    '0%': {
                        opacity: '0',
                        transform: 'scale(0.5) rotate(-10deg)',
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'scale(1) rotate(0deg)',
                    },
                },
                'sticky-disappear': {
                    '0%': {
                        opacity: '1',
                        transform: 'scale(1) rotate(0deg)',
                    },
                    '100%': {
                        opacity: '0',
                        transform: 'scale(0.5) rotate(10deg)',
                    },
                },
                'wiggle': {
                    '0%, 100%': { transform: 'rotate(-1deg)' },
                    '50%': { transform: 'rotate(1deg)' },
                },
                'flip': {
                    '0%': { transform: 'rotateY(0)' },
                    '100%': { transform: 'rotateY(180deg)' },
                },
                'bounce-gentle': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'paper-crumple': {
                    '0%': {
                        transform: 'scale(1) rotate(0deg)',
                        opacity: '1',
                    },
                    '50%': {
                        transform: 'scale(0.8) rotate(5deg)',
                        opacity: '0.7',
                    },
                    '100%': {
                        transform: 'scale(0) rotate(10deg)',
                        opacity: '0',
                    },
                },
            },
            // Add custom box shadows for sticky notes
            boxShadow: {
                'sticky-note': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), inset 0 -2px 5px rgba(0, 0, 0, 0.05)',
                'sticky-note-hover': '0 20px 40px -10px rgba(0, 0, 0, 0.2), 0 15px 15px -10px rgba(0, 0, 0, 0.08), inset 0 -3px 7px rgba(0, 0, 0, 0.1)',
                'sticky-note-paper': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 -2px 4px rgba(0, 0, 0, 0.05)',
            },
            // Add custom backdrop blur
            backdropBlur: {
                xs: '2px',
            },
            // Add custom transition properties
            transitionProperty: {
                'height': 'height',
                'spacing': 'margin, padding',
            },
        },
    },
    plugins: [tailwindcssAnimate],
};

export default config;