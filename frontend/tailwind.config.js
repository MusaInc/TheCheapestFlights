/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "serif"]
      },
      colors: {
        ink: "var(--ink)",
        paper: "var(--paper)",
        sand: "var(--sand)",
        accent: "var(--accent)",
        lagoon: "var(--lagoon)",
        clay: "var(--clay)",
        haze: "var(--haze)"
      },
      boxShadow: {
        soft: "0 24px 60px -40px rgba(15, 15, 30, 0.3)"
      },
      backgroundImage: {
        hero: "radial-gradient(1200px at 20% 10%, rgba(10, 132, 255, 0.16), transparent 55%), radial-gradient(800px at 80% 20%, rgba(140, 210, 255, 0.2), transparent 60%), linear-gradient(180deg, #f5f5f7 0%, #ffffff 40%, #f5f5f7 100%)"
      }
    }
  },
  plugins: []
};
