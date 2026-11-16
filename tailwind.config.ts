import type { Config } from "tailwindcss"
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        navy: "#141a2e",
        gold: "#f2b24b",
        teal: "#3cc9b0",
        dark: "#0b1020",
        ember: "#ff7a45",
        sea: "#4aa3ff",
        mist: "#d7e2f2",
        surface: "#121933",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(242,178,75,0.18), 0 10px 30px rgba(0,0,0,0.35)",
        soft: "0 10px 40px rgba(3,8,20,0.45)",
      },
      backgroundImage: {
        "hero-radial": "radial-gradient(1200px 500px at 10% -10%, rgba(242,178,75,0.18), transparent 60%), radial-gradient(900px 400px at 90% 0%, rgba(60,201,176,0.14), transparent 55%)",
      },
    },
  },
  plugins: [],
}
export default config
