import { describe, expect, jest, test } from "bun:test";
import { Observable, plugin, pubsub } from "./wip";

describe("pubsub and plugins", () => {
  test("customized subscribe", () => {
    const observer = new Observable<{
      type: "onSubscribe" | "onPublish";
      topicId: string;
    }>();
    const pluginObserver = jest.fn();
    observer.subscribe(pluginObserver);
    const a = plugin("A", observer);
    const b = plugin("B", observer);
    const ps = pubsub([a, b]);
    const cb = jest.fn();
    ps.subscribe("topic1", cb);
    // subscribe does not trigger onSubscribe.
    expect(pluginObserver).not.toHaveBeenCalled();
    ps.publish("topic1", "payload");
    expect(pluginObserver).toHaveBeenCalledWith({
      type: "onSubscribe",
      topicId: "topic1",
    });
    expect(pluginObserver).toHaveBeenCalledWith({
      type: "onPublish",
      topicId: "topic1",
    });
    expect(cb).toHaveBeenCalledWith("payload");
  });
});
