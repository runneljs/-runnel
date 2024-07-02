export type Metrics = {
  onPublishCreated: number;
  onSubscribeCreated: number;
  onPublish: unknown;
  onSubscribe: unknown;
};
export type MetricsRecord = Record<string, Metrics>;
export function createEventBusMetricPlugin(
  deepEqual: (a: any, b: any) => boolean,
  callback: (payload: MetricsRecord) => void,
): {
  register: () => void;
  unregister: () => void;
} {
  /**
   * Count up subscribe/publish events called by the local event bus.
   */
  const metrics: MetricsRecord = {};
  const initialTopicMetrics = {
    onSubscribeCreated: 0,
    onPublishCreated: 0,
    onPublish: null,
    onSubscribe: null,
  };

  function onSubscribeCreated(e: CustomEvent<{ topicId: string }>) {
    const { topicId } = e.detail;
    updateStats(topicId, (metrics: Metrics) => {
      return {
        ...metrics,
        onSubscribeCreated: metrics.onSubscribeCreated + 1,
      };
    });
  }

  function onPublishCreated(e: CustomEvent<{ topicId: string }>) {
    const { topicId } = e.detail;
    updateStats(topicId, (metrics: Metrics) => {
      return {
        ...metrics,
        onPublishCreated: metrics.onPublishCreated + 1,
      };
    });
  }

  function onPublish(e: CustomEvent<{ topicId: string; payload: unknown }>) {
    const { topicId, payload } = e.detail;
    updateStats(topicId, (metrics: Metrics) => {
      return {
        ...metrics,
        onPublish: payload ?? null,
      };
    });
  }

  function onSubscribe(e: CustomEvent<{ topicId: string; payload: unknown }>) {
    const { topicId, payload } = e.detail;
    updateStats(topicId, (metrics: Metrics) => {
      return {
        ...metrics,
        onSubscribe: payload ?? null,
      };
    });
  }

  function register() {
    addEventListener(
      "runnel:onsubscribecreated",
      onSubscribeCreated as EventListener,
    );
    addEventListener(
      "runnel:onpublishcreated",
      onPublishCreated as EventListener,
    );
    addEventListener("runnel:onpublish", onPublish as EventListener);
    addEventListener("runnel:onsubscribe", onSubscribe as EventListener);
  }

  function unregister() {
    removeEventListener(
      "runnel:onsubscribecreated",
      onSubscribeCreated as EventListener,
    );
    removeEventListener(
      "runnel:onpublishcreated",
      onPublishCreated as EventListener,
    );
    removeEventListener("runnel:onpublish", onPublish as EventListener);
    removeEventListener("runnel:onsubscribe", onSubscribe as EventListener);
  }

  return { register, unregister };

  function updateStats(topicId: string, diff: (metrics: Metrics) => Metrics) {
    const old = { ...metrics };
    metrics[topicId] ??= initialTopicMetrics;
    metrics[topicId] = { ...diff(metrics[topicId]) };

    if (!deepEqual(old, metrics)) {
      callback(metrics);
    }
  }
}
