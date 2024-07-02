import deepEqual from "deep-equal";
import type { DispatchEventName } from "../../runnel/src/dispatch-events";
import { createEventBusMetricPlugin } from "./metric-plugin";

describe("createEventBusMetricPlugin", () => {
  describe("plugin", () => {
    let callback: ReturnType<typeof vi.fn>;
    let plugin: ReturnType<typeof createEventBusMetricPlugin>;

    beforeAll(() => {
      callback = vi.fn();
      plugin = createEventBusMetricPlugin(deepEqual, callback);
      plugin.register();
    });

    afterAll(() => {
      vi.restoreAllMocks();
      plugin.unregister();
    });

    describe("subscribe -> publish", () => {
      test("should call callback with metrics on subscribe", () => {
        dispatchCustomEvent("runnel:onsubscribecreated", { topicId: "topic1" });
        expect(callback).toHaveBeenCalledWith({
          topic1: {
            onSubscribeCreated: 1,
            onPublishCreated: 0,
            onPublish: null,
            onSubscribe: null,
          },
        });
      });

      test("should call callback with metrics on publish", () => {
        dispatchCustomEvent("runnel:onpublishcreated", { topicId: "topic1" });
        expect(callback).toHaveBeenCalledWith({
          topic1: {
            onSubscribeCreated: 1,
            onPublishCreated: 1,
            onPublish: null,
            onSubscribe: null,
          },
        });
      });
    });

    describe("publish -> subscribe", () => {
      test("should call callback with metrics on publish", () => {
        dispatchCustomEvent("runnel:onpublishcreated", { topicId: "topic2" });
        expect(callback).toHaveBeenCalledWith({
          topic1: {
            onSubscribeCreated: 1,
            onPublishCreated: 1,
            onPublish: null,
            onSubscribe: null,
          },
          topic2: {
            onSubscribeCreated: 0,
            onPublishCreated: 1,
            onPublish: null,
            onSubscribe: null,
          },
        });
      });

      test("should call callback with metrics on subscribe", () => {
        dispatchCustomEvent("runnel:onsubscribecreated", { topicId: "topic2" });
        expect(callback).toHaveBeenCalledWith({
          topic1: {
            onSubscribeCreated: 1,
            onPublishCreated: 1,
            onPublish: null,
            onSubscribe: null,
          },
          topic2: {
            onSubscribeCreated: 1,
            onPublishCreated: 1,
            onPublish: null,
            onSubscribe: null,
          },
        });
      });
    });

    describe("additional publish/subscribe events", () => {
      test("a publish event to topic1", () => {
        dispatchCustomEvent("runnel:onpublish", {
          topicId: "topic1",
          payload: 1,
        });
        expect(callback).toHaveBeenCalledWith({
          topic1: {
            onSubscribeCreated: 1,
            onPublishCreated: 1,
            onPublish: 1,
            onSubscribe: null,
          },
          topic2: {
            onSubscribeCreated: 1,
            onPublishCreated: 1,
            onPublish: null,
            onSubscribe: null,
          },
        });
      });

      test("another publish event to topic1", () => {
        dispatchCustomEvent("runnel:onpublish", {
          topicId: "topic1",
          payload: 2,
        });
        expect(callback).toHaveBeenCalledWith({
          topic1: {
            onSubscribeCreated: 1,
            onPublishCreated: 1,
            onPublish: 2,
            onSubscribe: null,
          },
          topic2: {
            onSubscribeCreated: 1,
            onPublishCreated: 1,
            onPublish: null,
            onSubscribe: null,
          },
        });
      });

      test("a subscribe event to topic1", () => {
        dispatchCustomEvent("runnel:onsubscribe", {
          topicId: "topic2",
          payload: "Subscribe to topic2",
        });
        expect(callback).toHaveBeenCalledWith({
          topic1: {
            onSubscribeCreated: 1,
            onPublishCreated: 1,
            onPublish: 2,
            onSubscribe: null,
          },
          topic2: {
            onSubscribeCreated: 1,
            onPublishCreated: 1,
            onPublish: null,
            onSubscribe: "Subscribe to topic2",
          },
        });
      });
    });
  });
});

function dispatchCustomEvent(
  name: DispatchEventName,
  detail: Record<string, unknown> = {},
) {
  dispatchEvent(new CustomEvent(name, { detail }));
}
