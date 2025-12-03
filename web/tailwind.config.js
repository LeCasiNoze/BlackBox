/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      keyframes: {
        globalShine: {
          "0%": { transform: "translate(-20%, -20%)" },
          "50%": { transform: "translate(20%, 20%)" },
          "100%": { transform: "translate(-20%, -20%)" },
        },
        luxLight: {
          "0%": { transform: "translateX(-50%)" },
          "50%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(50%)" },
        },
        luxHalo: {
          "0%": { opacity: 0.08 },
          "50%": { opacity: 0.14 },
          "100%": { opacity: 0.08 },
        },
        verticalShine: {
          "0%": { transform: "translateY(-60%)" },
          "100%": { transform: "translateY(60%)" },
        },
      },
      animation: {
        luxLight: "luxLight 12s ease-in-out infinite",
        luxHalo: "luxHalo 8s ease-in-out infinite",
        verticalShine: "verticalShine 18s linear infinite",
        globalShine: "globalShine 22s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
