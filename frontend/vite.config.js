import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config: enables React fast-refresh and runs the dev server on :5173.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
