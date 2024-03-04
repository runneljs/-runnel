import { afterAll, describe, expect, test } from "bun:test";
import fs from "node:fs";
import { REPORT_DIR, createReporter } from "./create-reporter";

describe("createReporter", () => {
  afterAll(() => {
    fs.rmdirSync(REPORT_DIR, { recursive: true });
  });

  test("should throw an error", async () => {
    expect(() => createReporter("")).toThrow();
  });

  test("should return two functions", async () => {
    const { reporter, setReport } = createReporter(import.meta.url);
    expect(reporter).toBeDefined();
    expect(setReport).toBeDefined();
    expect(() => reporter()).not.toThrow();
  });

  describe("setReport", () => {
    test("should add a report", async () => {
      const { setReport, reporter } = createReporter(import.meta.url);
      setReport({ foo: "bar" });
      reporter();
      expect(() => reporter()).not.toThrow();
    });
  });
});
