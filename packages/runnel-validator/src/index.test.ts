import { beforeAll, describe, expect, test } from "bun:test";
import { validator } from "./index";

describe("varidator", () => {
  describe("with a schema", () => {
    let validate: ReturnType<typeof validator>;

    beforeAll(() => {
      validate = validator({ type: "object" });
    });

    test("should return true for valid payload", () => {
      expect(validate({})).toBe(true);
    });

    test("should return false for invalid payload", () => {
      expect(validate("")).toBe(false);
    });
  });

  describe("without a schema", () => {
    let validate: ReturnType<typeof validator>;

    beforeAll(() => {
      validate = validator({});
    });

    test("should return false for a payload", () => {
      expect(validate({})).toBe(false);
    });

    test("should return true for (null/undefined) payload", () => {
      expect(validate()).toBe(true);
      expect(validate(null)).toBe(true);
    });
  });
});
