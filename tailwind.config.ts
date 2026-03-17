import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#ECF3FF",
          500: "#465FFF",
          600: "#3641F5",
        },
        gray: {
          50: "#F9FAFB",
          100: "#F2F4F7",
          200: "#E4E7EC",
          400: "#98A2B3",
          500: "#667085",
          700: "#344054",
          900: "#1D2939",
        },
        success: {
          50: "#ECFDF3",
          600: "#039855",
          700: "#027A48",
        },
        error: {
          50: "#FEF3F2",
          600: "#D92D20",
          700: "#B42318",
        },
        warning: {
          50: "#FFFAEB",
          700: "#B54708",
        },
      },
      fontSize: {
        "kpi-hero": ["30px", { lineHeight: "1.2", fontWeight: "700" }],
        "kpi-std": ["24px", { lineHeight: "1.2", fontWeight: "700" }],
        "page-title": ["20px", { lineHeight: "1.2", fontWeight: "600" }],
        "card-title": ["18px", { lineHeight: "1.2", fontWeight: "600" }],
      },
      borderRadius: {
        card: "16px",
      },
    },
  },
  plugins: [],
};
export default config;
