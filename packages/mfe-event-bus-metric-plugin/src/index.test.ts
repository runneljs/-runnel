import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "bun:test";
import deepEqual from "deep-equal";
import { createPlugin } from "./index";

describe("event-bus-metric-plugin", () => {
  let plugin: ReturnType<typeof createPlugin>["plugin"];
  let observer: ReturnType<typeof createPlugin>["observer"];

  beforeAll(() => {
    let result = createPlugin(deepEqual);
    plugin = result.plugin;
    observer = result.observer;
  });

  test("should export observer", () => {
    expect(observer.subscribe).toBeFunction();
    expect(observer.unsubscribe).toBeFunction();
  });

  test("should export plugin", () => {
    expect(plugin).toBeFunction();
  });

  describe("subscribe", () => {
    let callback: jest.Mock;
    let instance: ReturnType<typeof plugin>;
    beforeEach(() => {
      instance = plugin();
      callback = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test("should call callback with metrics on subscribe", () => {
      observer.subscribe(callback);
      instance.onSubscribe("topic1", {
        schema: { type: "number" },
        subscribers: new Map(),
      });
      expect(callback).toHaveBeenCalledWith({
        topic1: { subscribe: 1, publish: 0, schema: { type: "number" } },
      });
    });

    test("should call callback with metrics on publish", () => {
      observer.subscribe(callback);
      instance.onPublish("topic1", {
        schema: { type: "number" },
        subscribers: new Map(),
      });
      expect(callback).toHaveBeenCalledWith({
        topic1: { subscribe: 0, publish: 1, schema: { type: "number" } },
      });
    });
  });

  describe("plugin", () => {
    describe("publish -> subscribe", () => {
      let instance: ReturnType<typeof plugin>;
      beforeAll(() => {
        instance = plugin();
      });

      let callback: jest.Mock;
      beforeEach(() => {
        callback = jest.fn();
        observer.subscribe(callback);
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      test("should call callback with metrics on publish", () => {
        instance.onPublish("topic2", {
          schema: { type: "string" },
          subscribers: new Map(),
        });
        expect(callback).toHaveBeenCalledWith({
          topic2: { subscribe: 0, publish: 1, schema: { type: "string" } },
        });
      });

      test("should call callback with metrics on subscribe and keep the previous action's result (onPublish)", () => {
        instance.onSubscribe("topic2", {
          schema: { type: "string" },
          subscribers: new Map(),
        });
        expect(callback).toHaveBeenCalledWith({
          topic2: { subscribe: 1, publish: 1, schema: { type: "string" } },
        });
      });
    });

    describe("subscribe -> publish", () => {
      let instance: ReturnType<typeof plugin>;
      beforeAll(() => {
        instance = plugin();
      });

      let callback: jest.Mock;
      beforeEach(() => {
        callback = jest.fn();
        observer.subscribe(callback);
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      test("should call callback with metrics on subscribe", () => {
        instance.onSubscribe("topic3", {
          schema: { type: "string" },
          subscribers: new Map(),
        });
        expect(callback).toHaveBeenCalledWith({
          topic3: { subscribe: 1, publish: 0, schema: { type: "string" } },
        });
      });

      test("should call callback with metrics on publish and keep the previous action's result (onSubscribe)", () => {
        instance.onPublish("topic3", {
          schema: { type: "string" },
          subscribers: new Map(),
        });
        expect(callback).toHaveBeenCalledWith({
          topic3: { subscribe: 1, publish: 1, schema: { type: "string" } },
        });
      });
    });
  });
});
