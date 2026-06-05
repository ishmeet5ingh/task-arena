import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        abyss: "#060812",
        panel: "rgba(15, 23, 42, 0.78)",
        cyanpulse: "#2dd4bf",
        volt: "#a3e635",
        danger: "#fb7185",
        warning: "#facc15"
      },
      boxShadow: {
        neon: "0 0 30px rgba(45, 212, 191, 0.25)",
        gold: "0 0 30px rgba(250, 204, 21, 0.25)",
        redglow: "0 0 30px rgba(251, 113, 133, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;
