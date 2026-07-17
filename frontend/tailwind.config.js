/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B1220",
          900: "#111A2E",
          800: "#1A2744",
          700: "#243556",
        },
        leaf: {
          400: "#3DDC97",
          500: "#1DBF7A",
          600: "#0F9F6E",
          700: "#0B7A55",
        },
        saffron: {
          400: "#FFB347",
          500: "#F4A261",
          600: "#E76F51",
        },
        mist: {
          50: "#F3F7FB",
          100: "#E7EEF6",
          200: "#CDDAE8",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 50px rgba(11, 18, 32, 0.12)",
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(61,220,151,0.18), transparent), radial-gradient(ellipse 70% 50% at 80% 10%, rgba(244,162,97,0.2), transparent), linear-gradient(160deg, #0B1220 0%, #15233D 45%, #0F1B30 100%)",
        "app-light":
          "radial-gradient(ellipse 90% 50% at 10% -10%, rgba(61,220,151,0.12), transparent), radial-gradient(ellipse 70% 40% at 100% 0%, rgba(231,111,81,0.08), transparent), linear-gradient(180deg, #F3F7FB 0%, #E7EEF6 100%)",
      },
    },
  },
  plugins: [],
};
