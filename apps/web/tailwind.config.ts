import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf3f7",
          100: "#fbe6ef",
          200: "#f6c9dd",
          300: "#eea0c1",
          400: "#e26ea0",
          500: "#d1447f",
          600: "#b32c64",
          700: "#932051",
          800: "#791c44",
          900: "#671b3c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
