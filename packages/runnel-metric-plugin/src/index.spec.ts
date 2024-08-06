import deepEqual from "deep-equal";
import { onAddEventListenerEventName, onPostMessageEventName } from "runneljs";
import type { DispatchEventName } from "../../runnel/src/dispatch-events";
import { createPlugin } from "./index";

describe("event-bus-metric-plugin", () => {
  describe("subscribe", () => {
    let callback: ReturnType<typeof vi.fn>;
    const { register, unregister, observer } = createPlugin(deepEqual);

    beforeAll(() => {
      register();
    });

    afterAll(() => {
      unregister();
    });

    beforeEach(() => {
      callback = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test("should call callback with metrics on subscribe", () => {
      observer.subscribe(callback);
      dispatchCustomEvent(onAddEventListenerEventName, { topicId: "topic1" });
      expect(callback).toHaveBeenCalledWith({
        topic1: {
          schema: {},
          onCreateTopic: 0,
          lastPayload: null,
          onPostMessage: 0,
          onAddEventListener: 1,
          onRemoveEventListener: 0,
        },
      });
    });

    test("should call callback with metrics on publish", () => {
      observer.subscribe(callback);
      dispatchCustomEvent(onPostMessageEventName, {
        topicId: "topic1",
        payload: "Publish to topic1",
      });
      expect(callback).toHaveBeenCalledWith({
        topic1: {
          schema: {},
          onCreateTopic: 0,
          lastPayload: "Publish to topic1",
          onPostMessage: 1,
          onAddEventListener: 1,
          onRemoveEventListener: 0,
        },
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
