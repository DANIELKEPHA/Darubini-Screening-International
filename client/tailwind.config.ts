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
				sligoil: ['var(--font-sligoil)', 'sans-serif'], // Changed fallback to sans-serif
				geist: ['var(--font-geist-sans)', 'sans-serif'], // Added Geist Sans
				'geist-mono': ['var(--font-geist-mono)', 'monospace'], // Added Geist Mono
			},
		},
	},
	plugins: [tailwindcssAnimate],
};

export default config;