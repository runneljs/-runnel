import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["src/test-utils/setup.ts"],
    coverage: {
      include: ["src/**/*.ts", "src/**/*.tsx"],
      thresholds: {
        statements: 80,
        branches: 80,
        lines: 80,
        functions: 80,
      },
    },
  },
});
