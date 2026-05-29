export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff1f1",
          100: "#ffe0e0",
          200: "#ffc7c7",
          300: "#ff9b9b",
          400: "#ff5f63",
          500: "#ed1c24",
          600: "#d9141c",
          700: "#b50f16",
          800: "#8f1116",
          900: "#741418",
          950: "#3f0608"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};
