import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import cssInjectedByJSPlugin from "vite-plugin-css-injected-by-js";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cssInjectedByJSPlugin()],
  build: {
    rollupOptions: {
      output: {
        dir: "dist",
        entryFileNames: "app2.js",
      },
    },
  },
});
