export type Metrics = Record<
  string,
  {
    onCreatePublish: number;
    onCreateSubscribe: number;
    schema: object | null;
    publish: any[];
    subscribe: any[];
  }
>;
export function createEventBusMetricPlugin(
  deepEqual: (a: any, b: any) => boolean,
  callback: (payload: Metrics) => void,
) {
  /**
   * Count up subscribe/publish events called by the local event bus.
   */
  const metrics: Metrics = {};
  const initialTopicMetrics = {
    onCreateSubscribe: 0,
    onCreatePublish: 0,
    publish: [],
    subscribe: [],
    schema: null,
  };

  return {
    onCreateSubscribe: (topicId: string, schema: object) => {
      updateStats(topicId, schema, "onCreateSubscribe");
    },
    onCreatePublish: (topicId: string, schema: object) => {
      updateStats(topicId, schema, "onCreatePublish");
    },
    publish: (topicId: string, payload: any) => {
      metrics[topicId] ??= initialTopicMetrics;
      metrics[topicId].publish.push(payload);
    },
    subscribe: (topicId: string, payload: any) => {
      metrics[topicId] ??= initialTopicMetrics;
      metrics[topicId].subscribe.push(payload);
    },
  };

  function updateStats(
    topicId: string,
    schema: object,
    statType: "onCreateSubscribe" | "onCreatePublish",
  ) {
    const old = { ...metrics };
    metrics[topicId] ??= initialTopicMetrics;

    metrics[topicId] = {
      ...metrics[topicId],
      ...{
        [statType]: metrics[topicId][statType] + 1,
        schema,
      },
    };

    if (!deepEqual(old, metrics)) {
      callback(metrics);
    }
  }
}
