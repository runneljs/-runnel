import { describe, expect, test } from "bun:test";
import { payloadValidator } from "./payload-validator";

describe("payloadValidator", () => {
  test("should throw error if payload mismatch", () => {
    const validator = payloadValidator((schema) => (payload) => false);
    expect(() => validator("topicId", { type: "string" }, 123)).toThrow(
      'Invalid payload for the topic [topicId].\nPlease make sure the payload matches the schema.\nJSON Schema:{"type":"string"}\nPayload:123',
    );
  });

  test("should not throw error if payload match", () => {
    const validator = payloadValidator((schema) => (payload) => true);
    expect(() => validator("topicId", { type: "string" }, "123")).not.toThrow();
  });
});
