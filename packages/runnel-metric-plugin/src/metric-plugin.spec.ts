import deepEqual from "deep-equal";
import {
  onAddEventListenerEventName,
  onCreateTopicEventName,
  onPostMessageEventName,
  onRemoveEventListenerEventName,
} from "runneljs";
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

    describe("Create -> Subscribe -> Publish -> Unsubscribe", () => {
      test("should call callback with metrics on create topic", () => {
        dispatchCustomEvent(onCreateTopicEventName, {
          topicId: "topic1",
          jsonSchema: { type: "string" },
        });
        expect(callback).toHaveBeenCalledWith({
          topic1: {
            schema: {
              type: "string",
            },
            onCreateTopic: 1,
            lastPayload: null,
            onPostMessage: 0,
            onAddEventListener: 0,
            onRemoveEventListener: 0,
          },
        });
      });

      test("should call callback with metrics on subscribe", () => {
        dispatchCustomEvent(onAddEventListenerEventName, { topicId: "topic1" });
        expect(callback).toHaveBeenCalledWith({
          topic1: {
            schema: {
              type: "string",
            },
            onCreateTopic: 1,
            lastPayload: null,
            onPostMessage: 0,
            onAddEventListener: 1,
            onRemoveEventListener: 0,
          },
        });
      });

      test("should call callback with metrics on publish", () => {
        dispatchCustomEvent(onPostMessageEventName, {
          topicId: "topic1",
          payload: "Publish to topic1",
        });
        expect(callback).toHaveBeenCalledWith({
          topic1: {
            schema: {
              type: "string",
            },
            onCreateTopic: 1,
            lastPayload: "Publish to topic1",
            onPostMessage: 1,
            onAddEventListener: 1,
            onRemoveEventListener: 0,
          },
        });
      });

      test("should call callback with metrics on unsubscribe", () => {
        dispatchCustomEvent(onRemoveEventListenerEventName, {
          topicId: "topic1",
        });
        expect(callback).toHaveBeenCalledWith({
          topic1: {
            schema: {
              type: "string",
            },
            onCreateTopic: 1,
            lastPayload: "Publish to topic1",
            onPostMessage: 1,
            onAddEventListener: 1,
            onRemoveEventListener: 1,
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
