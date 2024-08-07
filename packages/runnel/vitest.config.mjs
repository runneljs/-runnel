import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    coverage: {
      exclude: [
        "build.mjs",
        "src/index.ts",
        "src/errors.ts",
        "src/get-global.ts",
        "src/test-utils",
      ],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
