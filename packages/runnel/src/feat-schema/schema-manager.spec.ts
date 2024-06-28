import deepEqual from "deep-equal";
import { schemaManager } from "./schema-manager";

describe("schemaManager", () => {
  describe("checkSchema", () => {
    test("should throw error if schema mismatch", () => {
      const schemaStore = new Map();
      schemaStore.set("topicId", { type: "string" });
      expect(() =>
        schemaManager(deepEqual, schemaStore).checkSchema("topicId", {
          type: "number",
        }),
      ).toThrow(
        'The topic [topicId] has been registered with a different schema.\nExpected:{"type":"string"},\nReceived:{"type":"number"}',
      );
    });

    test("should not throw error if schema match", () => {
      const schemaStore = new Map();
      schemaStore.set("topicId", { type: "string" });

      expect(() => {
        schemaManager(deepEqual, schemaStore).checkSchema("topicId", {
          type: "string",
        });
      }).not.toThrow();
    });

    test("should not throw error if schema not exist", () => {
      const schemaStore = new Map();

      expect(() => {
        schemaManager(deepEqual, schemaStore).checkSchema("topicId", {
          type: "string",
        });
      }).not.toThrow();
    });
  });
});
