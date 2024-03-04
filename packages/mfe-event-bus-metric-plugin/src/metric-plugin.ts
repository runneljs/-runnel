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
  return {
    onCreateSubscribe: (topicId: string, schema: object) => {
      const old = { ...metrics };
      metrics[topicId] = {
        subscribe: metrics[topicId] ? metrics[topicId].subscribe + 1 : 1,
        publish: metrics[topicId]?.publish || 0,
        schema,
      };
      if (!deepEqual(old, metrics)) {
        callback(metrics);
      }
    },
    onCreatePublish: (topicId: string, schema: object) => {
      const old = { ...metrics };
      metrics[topicId] = {
        subscribe: metrics[topicId]?.subscribe || 0,
        publish: metrics[topicId] ? metrics[topicId].publish + 1 : 1,
        schema,
      };
      if (!deepEqual(old, metrics)) {
        callback(metrics);
      }
    },
  };
}
