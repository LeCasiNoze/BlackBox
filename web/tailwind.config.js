// web/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
module.exports = {
  theme: {
    extend: {
      keyframes: {
        luxLight: {
          '0%':   { transform: 'translateX(-50%)' },
          '50%':  { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(50%)' },
        },
      },
      animation: {
        luxLight: 'luxLight 12s ease-in-out infinite',
      }
    }
  }
}
