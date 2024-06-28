import deepEqual from "deep-equal";
import { createEventBusMetricPlugin } from "./metric-plugin";

describe("createEventBusMetricPlugin", () => {
  describe("plugin", () => {
    let callback: ReturnType<typeof vi.fn>;
    let plugin: ReturnType<typeof createEventBusMetricPlugin>;

    beforeAll(() => {
      callback = vi.fn();
      plugin = createEventBusMetricPlugin(deepEqual, callback);
    });

    afterAll(() => {
      vi.restoreAllMocks();
    });

    describe("subscribe -> publish", () => {
      test("should call callback with metrics on subscribe", () => {
        plugin.onCreateSubscribe("topic1");
        expect(callback).toHaveBeenCalledWith({
          topic1: {
            onCreateSubscribe: 1,
            onCreatePublish: 0,
            publish: [],
            subscribe: [],
          },
        });
      });

      test("should call callback with metrics on publish", () => {
        plugin.onCreatePublish("topic1");
        expect(callback).toHaveBeenCalledWith({
          topic1: {
            onCreateSubscribe: 1,
            onCreatePublish: 1,
            publish: [],
            subscribe: [],
          },
        });
      });
    });

    describe("publish -> subscribe", () => {
      test("should call callback with metrics on publish", () => {
        plugin.onCreatePublish("topic2");
        expect(callback).toHaveBeenCalledWith({
          topic1: {
            onCreateSubscribe: 1,
            onCreatePublish: 1,
            publish: [],
            subscribe: [],
          },
          topic2: {
            onCreateSubscribe: 0,
            onCreatePublish: 1,
            publish: [],
            subscribe: [],
          },
        });
      });

      test("should call callback with metrics on subscribe", () => {
        plugin.onCreateSubscribe("topic2");
        expect(callback).toHaveBeenCalledWith({
          topic1: {
            onCreateSubscribe: 1,
            onCreatePublish: 1,
            publish: [],
            subscribe: [],
          },
          topic2: {
            onCreateSubscribe: 1,
            onCreatePublish: 1,
            publish: [],
            subscribe: [],
          },
        });
      });
    });

    describe("additional publish/subscribe events", () => {
      test("a publish event to topic1", () => {
        plugin.publish("topic1", 1);
        expect(callback).toHaveBeenCalledWith({
          topic1: {
            onCreateSubscribe: 1,
            onCreatePublish: 1,
            publish: [1],
            subscribe: [],
          },
          topic2: {
            onCreateSubscribe: 1,
            onCreatePublish: 1,
            publish: [],
            subscribe: [],
          },
        });
      });

      test("another publish event to topic1", () => {
        plugin.publish("topic1", 2);
        expect(callback).toHaveBeenCalledWith({
          topic1: {
            onCreateSubscribe: 1,
            onCreatePublish: 1,
            publish: [1, 2],
            subscribe: [],
          },
          topic2: {
            onCreateSubscribe: 1,
            onCreatePublish: 1,
            publish: [],
            subscribe: [],
          },
        });
      });

      test("a subscribe event to topic1", () => {
        plugin.subscribe("topic2", "Subscribe to topic2");
        expect(callback).toHaveBeenCalledWith({
          topic1: {
            onCreateSubscribe: 1,
            onCreatePublish: 1,
            publish: [1, 2],
            subscribe: [],
          },
          topic2: {
            onCreateSubscribe: 1,
            onCreatePublish: 1,
            publish: [],
            subscribe: ["Subscribe to topic2"],
          },
        });
      });
    });
  });
});
