import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // ou plugin-react-swc selon ton package.json

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:3000", // ton backend
        changeOrigin: true,
      },
      // 👇 AJOUT : proxy pour les images
      "/uploads": {
        target: "http://localhost:3000", // même backend
        changeOrigin: true,
      },
    },
  },
});
