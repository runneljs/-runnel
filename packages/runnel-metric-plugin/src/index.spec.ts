import deepEqual from "deep-equal";
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
      observer.subscribe(callback);
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
});

function dispatchCustomEvent(
  name: DispatchEventName,
  detail: Record<string, unknown> = {},
) {
  dispatchEvent(new CustomEvent(name, { detail }));
}
