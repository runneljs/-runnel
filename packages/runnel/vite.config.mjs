import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "esnext",
    outdir: "./dist",
    lib: {
      entry: "./src/index.ts",
      formats: ["es", "cjs"],
      fileName: (format) => {
        return {
          es: "index.js",
          cjs: "index.cjs",
        }[format];
      },
    },
    sourcemap: true,
    minify: "esbuild",
  },
});
