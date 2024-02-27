import { Subscription } from "mfe-event-bus";

type SubscribeStats = Record<string, { length: number; schema: object }>;
type PublishStats = Record<string, number>;
export type EventBusMetricPluginPayload = {
  subscribeStats?: SubscribeStats;
  publishStats?: PublishStats;
};

export const eventBusMetricPlugin =
  (callback: (payload: EventBusMetricPluginPayload) => void) => () => {
    const subscribeStats: SubscribeStats = {};
    const publishStats: PublishStats = {};
    /**
     * Observe local event bus for subscribe and publish events.
     */
    return {
      onSubscribe: (topicId: string, subscription: Subscription) => {
        subscribeStats[topicId] = {
          length: subscribeStats[topicId]
            ? subscribeStats[topicId].length + 1
            : 1,
          schema: subscription.schema,
        };
        callback({ subscribeStats, publishStats });
      },
      onPublish: (topicId: string) => {
        publishStats[topicId]
          ? publishStats[topicId]++
          : (publishStats[topicId] = 1);
        callback({ subscribeStats, publishStats });
      },
    };
  };
