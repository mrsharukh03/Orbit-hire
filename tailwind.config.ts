/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // 🌌 Cosmic AI Palette
                background: {
                    light: "#FFFFFF",
                    dark: "#05050A", // Deep space black (not plain black)
                },
                surface: {
                    light: "#F3F4F6",
                    dark: "#0F111A", // Slightly lighter for cards/nav
                },
                primary: {
                    DEFAULT: "#6366F1", // Indigo
                    glow: "#818CF8",
                    dark: "#4F46E5",
                },
                accent: {
                    DEFAULT: "#06B6D4", // Cyan (AI Tech feel)
                    glow: "#22D3EE",
                },
                text: {
                    light: "#1F2937",
                    muted: "#6B7280",
                    dark: "#E5E7EB",
                    darkMuted: "#9CA3AF",
                },
            },
            fontFamily: {
                sans: ["Inter", "sans-serif"], // Clean, readable
                display: ["Space Grotesk", "sans-serif"], // Futuristic headers (Optional)
            },
            animation: {
                "spin-slow": "spin 8s linear infinite",
                ticker: "ticker 30s linear infinite",
                blob: "blob 7s infinite",
                "fade-in-up": "fadeInUp 0.5s ease-out forwards",
            },
            keyframes: {
                ticker: {
                    "0%": { transform: "translateX(0%)" },
                    "100%": { transform: "translateX(-100%)" },
                },
                blob: {
                    "0%": { transform: "translate(0px, 0px) scale(1)" },
                    "33%": { transform: "translate(30px, -50px) scale(1.1)" },
                    "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
                    "100%": { transform: "translate(0px, 0px) scale(1)" },
                },
                fadeInUp: {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
            backdropBlur: {
                xs: "2px",
            },
        },
    },
    plugins: [
        require("@tailwindcss/forms"),
        require("@tailwindcss/typography"),
        // Note: line-clamp is included in Tailwind v3.3+ by default
    ],
};