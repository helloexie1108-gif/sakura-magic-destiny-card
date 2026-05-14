import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: mode === "github-pages" ? "/sakura-magic-destiny-card/" : "/",
  plugins: [react()],
  server: {
    host: "0.0.0.0"
  }
}));
