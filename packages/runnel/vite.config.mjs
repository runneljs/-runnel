import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const PACKAGE_NAME = "index";
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: PACKAGE_NAME,
      fileName: (format) => `${PACKAGE_NAME}.${format}.js`,
    },
  },
  plugins: [
    dts({
      include: "src/**",
      exclude: ["src/**/*.test.*"],
    }),
  ],
});
