/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "@happy-dom/jest-environment",
  collectCoverageFrom: ["<rootDir>/src/**/*.{ts,tsx}"],
  testMatch: ["<rootDir>/src/**/*.jest.{ts,tsx}"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.jest.json" }],
  },
  moduleNameMapper: {
    "\\.css$": "<rootDir>/src/test-utils/style-mock.ts",
  },
};
