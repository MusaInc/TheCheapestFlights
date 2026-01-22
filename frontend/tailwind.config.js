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
        soft: "0 20px 60px -40px rgba(32, 24, 16, 0.6)"
      },
      backgroundImage: {
        hero: "radial-gradient(circle at 10% 20%, rgba(246, 167, 69, 0.25), transparent 50%), radial-gradient(circle at 80% 10%, rgba(12, 109, 122, 0.2), transparent 45%), linear-gradient(130deg, #f9f3ea 0%, #fff7ed 50%, #f1efe6 100%)"
      }
    }
  },
  plugins: []
};
