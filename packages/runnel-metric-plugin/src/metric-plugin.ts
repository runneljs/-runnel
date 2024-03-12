export type Metrics = {
  onCreatePublish: number;
  onCreateSubscribe: number;
  schema: object | null;
  publish: any[];
  subscribe: any[];
};
export type MetricsRecord = Record<string, Metrics>;
export function createEventBusMetricPlugin(
  deepEqual: (a: any, b: any) => boolean,
  callback: (payload: MetricsRecord) => void,
) {
  /**
   * Count up subscribe/publish events called by the local event bus.
   */
  const metrics: MetricsRecord = {};
  const initialTopicMetrics = {
    onCreateSubscribe: 0,
    onCreatePublish: 0,
    publish: [],
    subscribe: [],
    schema: null,
  };

  return {
    onCreateSubscribe: (topicId: string, schema: object) => {
      updateStats(topicId, (metrics: Metrics) => {
        return {
          ...metrics,
          schema,
          onCreateSubscribe: metrics.onCreateSubscribe + 1,
        };
      });
    },
    onCreatePublish: (topicId: string, schema: object) => {
      updateStats(topicId, (metrics: Metrics) => {
        return {
          ...metrics,
          schema,
          onCreatePublish: metrics.onCreatePublish + 1,
        };
      });
    },
    publish: (topicId: string, payload: any) => {
      updateStats(topicId, (metrics: Metrics) => {
        return {
          ...metrics,
          publish: [...metrics.publish, payload],
        };
      });
      return payload;
    },
    subscribe: (topicId: string, payload: any) => {
      updateStats(topicId, (metrics: Metrics) => {
        return {
          ...metrics,
          subscribe: [...metrics.subscribe, payload],
        };
      });
      return payload;
    },
  };

  function updateStats(topicId: string, diff: (metrics: Metrics) => Metrics) {
    const old = { ...metrics };
    metrics[topicId] ??= initialTopicMetrics;
    metrics[topicId] = { ...diff(metrics[topicId]) };

    if (!deepEqual(old, metrics)) {
      callback(metrics);
    }
  }
}
