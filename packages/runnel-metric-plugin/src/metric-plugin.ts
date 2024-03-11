export type Metrics = Record<
  string,
  { publish: number; subscribe: number; schema: object | null }
>;
export function createEventBusMetricPlugin(
  deepEqual: (a: any, b: any) => boolean,
  callback: (payload: Metrics) => void,
) {
  /**
   * Count up subscribe/publish events called by the local event bus.
   */
  const metrics: Metrics = {};
  const initialState = {
    subscribe: 0,
    publish: 0,
    schema: null,
  };

  return {
    onCreateSubscribe: (topicId: string, schema: object) => {
      updateStats(topicId, schema, "subscribe");
    },
    onCreatePublish: (topicId: string, schema: object) => {
      updateStats(topicId, schema, "publish");
    },
  };

  function updateStats(
    topicId: string,
    schema: object,
    statType: "subscribe" | "publish",
  ) {
    const old = { ...metrics };
    metrics[topicId] ??= initialState;

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
