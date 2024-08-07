import deepEqual from "deep-equal";
import { createSchemaManager } from "./schema-manager";

describe("schemaManager", () => {
  describe("checkSchema", () => {
    test("should throw error if schema mismatch", () => {
      const schemaStore = new Map();
      schemaStore.set("topicId", { type: "string" });
      expect(() =>
        createSchemaManager(deepEqual, schemaStore).checkSchema("topicId", {
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
        createSchemaManager(deepEqual, schemaStore).checkSchema("topicId", {
          type: "string",
        });
      }).not.toThrow();
    });

    test("should not throw error if schema not exist", () => {
      const schemaStore = new Map();

      expect(() => {
        createSchemaManager(deepEqual, schemaStore).checkSchema("topicId", {
          type: "string",
        });
      }).not.toThrow();
    });
  });

  describe("getTopics", () => {
    test("should return all topics", () => {
      const schemaStore = new Map();
      schemaStore.set("topicId", { type: "string" });
      schemaStore.set("topicId2", { type: "number" });

      expect(createSchemaManager(deepEqual, schemaStore).getTopics()).toEqual([
        "topicId",
        "topicId2",
      ]);
    });
  });

  describe("getSchemaByTopicId", () => {
    test("should return schema by topicId", () => {
      const schemaStore = new Map();
      schemaStore.set("topicId", { type: "string" });

      expect(
        createSchemaManager(deepEqual, schemaStore).getSchemaByTopicId(
          "topicId",
        ),
      ).toEqual({ type: "string" });
    });
  });
});
