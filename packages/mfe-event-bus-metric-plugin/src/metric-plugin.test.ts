import { beforeAll, describe, expect, jest, test } from "bun:test";
import deepEqual from "deep-equal";
import { createEventBusMetricPlugin } from "./metric-plugin";

describe("createEventBusMetricPlugin", () => {
  test("should return a function", () => {
    const callback = () => {};
    expect(createEventBusMetricPlugin(deepEqual, callback)).toBeFunction();
  });

  describe("returned function", () => {
    let callback: jest.Mock;
    let instance: ReturnType<ReturnType<typeof createEventBusMetricPlugin>>;

    beforeAll(() => {
      callback = jest.fn();
      const plugin = createEventBusMetricPlugin(deepEqual, callback);
      instance = plugin();
    });

    describe("subscribe -> publish", () => {
      test("should call callback with metrics on subscribe", () => {
        instance.onSubscribe("topic1", {
          schema: { type: "number" },
          subscribers: new Map(),
        });
        expect(callback).toHaveBeenCalledWith({
          topic1: { subscribe: 1, publish: 0, schema: { type: "number" } },
        });
      });

      test("should call callback with metrics on publish", () => {
        instance.onPublish("topic1", {
          schema: { type: "number" },
          subscribers: new Map(),
        });
        expect(callback).toHaveBeenCalledWith({
          topic1: { subscribe: 1, publish: 1, schema: { type: "number" } },
        });
      });
    });

    describe("publish -> subscribe", () => {
      test("should call callback with metrics on publish", () => {
        instance.onPublish("topic2", {
          schema: { type: "string" },
          subscribers: new Map(),
        });
        expect(callback).toHaveBeenCalledWith({
          topic1: { subscribe: 1, publish: 1, schema: { type: "number" } },
          topic2: { subscribe: 0, publish: 1, schema: { type: "string" } },
        });
      });

      test("should call callback with metrics on subscribe", () => {
        instance.onSubscribe("topic2", {
          schema: { type: "string" },
          subscribers: new Map(),
        });
        expect(callback).toHaveBeenCalledWith({
          topic1: { subscribe: 1, publish: 1, schema: { type: "number" } },
          topic2: { subscribe: 1, publish: 1, schema: { type: "string" } },
        });
      });
    });
  });
});
