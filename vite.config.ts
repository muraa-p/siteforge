import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * The app is served from /app/ in production (the landing page owns "/"), but
 * stays at / during development so `npm run dev` keeps working unchanged.
 */
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/app/" : "/",
  build: { outDir: "dist/app" },
}));
