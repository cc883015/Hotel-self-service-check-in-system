import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Local dev: wrangler on :8787, Vite on :5173.
// Proxy forwards /api/* to the Worker so cookies work as same-origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,             // expose on LAN so you can test on your phone
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
