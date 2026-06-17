import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest:     { DEFAULT: "#1A3C2E", deep: "#122B21", mid: "#224D3A" },
        gold:       { DEFAULT: "#C9943A", light: "#DFB060", dark: "#A87A2A" },
        ivory:      "#F7F3EC",
        charcoal:   "#1C1C1C",
        terracotta: "#C4622D",
        sand:       "#E8DCCC",
      },
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        accent:  ["Playfair Display",   "Georgia", "serif"],
        body:    ["DM Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        btn:  "8px",
      },
      boxShadow: {
        card: "0px 8px 24px rgba(0,0,0,0.08)",
        gold: "0px 0px 0px 3px rgba(201,148,58,0.4)",
        lg:   "0px 16px 48px rgba(0,0,0,0.16)",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #C9943A, #DFB060)",
        "forest-gradient": "linear-gradient(180deg, transparent 0%, #1A3C2E 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
