import { beforeAll, describe, expect, jest, test } from "bun:test";
import deepEqual from "deep-equal";
import { createEventBusMetricPlugin } from "./metric-plugin";

describe("createEventBusMetricPlugin", () => {
  describe("plugin", () => {
    let callback: jest.Mock;
    let plugin: ReturnType<typeof createEventBusMetricPlugin>;

    beforeAll(() => {
      callback = jest.fn();
      plugin = createEventBusMetricPlugin(deepEqual, callback);
    });

    describe("subscribe -> publish", () => {
      test("should call callback with metrics on subscribe", () => {
        plugin.onCreateSubscribe("topic1", {
          type: "number",
        });
        expect(callback).toHaveBeenCalledWith({
          topic1: { subscribe: 1, publish: 0, schema: { type: "number" } },
        });
      });

      test("should call callback with metrics on publish", () => {
        plugin.onCreatePublish("topic1", {
          type: "number",
        });
        expect(callback).toHaveBeenCalledWith({
          topic1: { subscribe: 1, publish: 1, schema: { type: "number" } },
        });
      });
    });

    describe("publish -> subscribe", () => {
      test("should call callback with metrics on publish", () => {
        plugin.onCreatePublish("topic2", {
          type: "string",
        });
        expect(callback).toHaveBeenCalledWith({
          topic1: { subscribe: 1, publish: 1, schema: { type: "number" } },
          topic2: { subscribe: 0, publish: 1, schema: { type: "string" } },
        });
      });

      test("should call callback with metrics on subscribe", () => {
        plugin.onCreateSubscribe("topic2", {
          type: "string",
        });
        expect(callback).toHaveBeenCalledWith({
          topic1: { subscribe: 1, publish: 1, schema: { type: "number" } },
          topic2: { subscribe: 1, publish: 1, schema: { type: "string" } },
        });
      });
    });
  });
});
