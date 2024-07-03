import { vi } from "vitest";

export const metricPlugin = (mock: ReturnType<typeof vi.fn>) => {
  const subscribeStats: Record<string, number> = {};
  const publishStats: Record<string, number> = {};
  const subStats: Record<string, number> = {};
  const pubStats: Record<string, number> = {};

  function onSubscribeCreated(e: CustomEvent<{ topicId: string }>) {
    const { detail } = e;
    const { topicId } = detail;
    subscribeStats[topicId]
      ? subscribeStats[topicId]++
      : (subscribeStats[topicId] = 1);
  }
  function onPublishCreated(e: CustomEvent<{ topicId: string }>) {
    const { detail } = e;
    const { topicId } = detail;
    publishStats[topicId]
      ? publishStats[topicId]++
      : (publishStats[topicId] = 1);
  }
  function onUnregisterAllTopics() {
    mock({ subscribeStats, publishStats, pubStats, subStats });
  }
  function onPublish(e: CustomEvent<{ topicId: string }>) {
    const { detail } = e;
    const { topicId } = detail;
    pubStats[topicId] ? pubStats[topicId]++ : (pubStats[topicId] = 1);
  }
  function onSubscribe(e: CustomEvent<{ topicId: string }>) {
    const { detail } = e;
    const { topicId } = detail;
    subStats[topicId] ? subStats[topicId]++ : (subStats[topicId] = 1);
  }
  return {
    register: () => {
      window.addEventListener(
        "runnel:onsubscribecreated",
        onSubscribeCreated as EventListener,
      );
      window.addEventListener(
        "runnel:onpublishcreated",
        onPublishCreated as EventListener,
      );
      window.addEventListener(
        "runnel:onunregisteralltopics",
        onUnregisterAllTopics as EventListener,
      );
      window.addEventListener("runnel:onpublish", onPublish as EventListener);
      window.addEventListener(
        "runnel:onsubscribe",
        onSubscribe as EventListener,
      );
    },
    unregister: () => {
      window.removeEventListener(
        "runnel:onsubscribecreated",
        onSubscribeCreated as EventListener,
      );
      window.removeEventListener(
        "runnel:onpublishcreated",
        onPublishCreated as EventListener,
      );
      window.removeEventListener(
        "runnel:onunregisteralltopics",
        onUnregisterAllTopics as EventListener,
      );
      window.removeEventListener(
        "runnel:onpublish",
        onPublish as EventListener,
      );
      window.removeEventListener(
        "runnel:onsubscribe",
        onSubscribe as EventListener,
      );
    },
  };
};
