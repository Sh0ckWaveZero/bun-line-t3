import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-noto-sans-thai)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
