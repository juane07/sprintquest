import type { Config } from "tailwindcss"
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1a1a2e",
        gold: "#f5a623",
        teal: "#2d9cdb",
        dark: "#0f0f23",
      },
    },
  },
  plugins: [],
}
export default config
