import { beforeAll, describe, expect, test } from "bun:test";
import { validator } from "./index";

describe("varidator", () => {
  let validate: (payload: unknown) => boolean;

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
