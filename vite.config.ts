import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@db": path.resolve(__dirname, "./server"),
    },
  },
  root: ".",
  publicDir: "public",
  build: {
    outDir: "dist/public",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "public/index.html"),
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
