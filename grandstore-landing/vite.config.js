import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/three/")) return "three";
          if (id.includes("/node_modules/gsap/")) return "gsap";
          if (
            /\/node_modules\/(motion|framer-motion|motion-dom|motion-utils)\//.test(
              id
            )
          )
            return "motion";
        },
      },
    },
  },
});
