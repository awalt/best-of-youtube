import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        
        extend: {
            keyframes: {
                "slide-up": {
                    "0%": {
                        transform: "translateY(100%)",
                        opacity: "0",
                    },
                    "100%": {
                        transform: "translateY(0)",
                        opacity: "1",
                    },
                },
                "fade-out": {
                    "0%": {
                        opacity: "1",
                    },
                    "100%": {
                        opacity: "0",
                    },
                },
            },
            animation: {
                "slide-up": "slide-up 0.5s ease-out forwards",
                "slide-up-and-fade-out":
                    "slide-up 0.5s ease-out forwards, fade-out 0.5s ease-out forwards",
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            fontSize: {
                'xxs': '.65rem', // 10.4px at 16px base font size
                'xxxs': '.55rem', // 8.8px at 16px base font size
            },
        },
    },
    plugins: [],
};
export default config;
