/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#050B18",
          panel: "#081126",
          divider: "rgba(255,255,255,0.10)",
          orange: "#F97316",
          purple: "#8B5CF6",
          teal: "#06B6D4",
          lightblue: "#38BDF8",
        },
      },
    },
  },
  plugins: [],
};
