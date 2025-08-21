import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: true,
    port: Number(process.env.VITE_PORT) || 5173,
    strictPort: true
  },
  preview: {
    host: true,
    port: 8080
  }
});
