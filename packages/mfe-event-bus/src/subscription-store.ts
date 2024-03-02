import type { JsonSchema, TopicId, UUID } from "./primitive-types";

export type Subscription = {
  schema: JsonSchema;
  subscribers: Map<UUID, (payload: any) => void>;
};
export type SubscriptionStore = ReturnType<typeof initSubscriptionStore>;

export function initSubscriptionStore() {
  const subscriptionStore = new Map<TopicId, Subscription>();
  return {
    get: (topicId: TopicId): Subscription | undefined =>
      subscriptionStore.get(topicId),
    set: (topicId: TopicId, subscription: Subscription): void => {
      subscriptionStore.set(topicId, subscription);
    },
    delete: (topicId: TopicId): void => {
      subscriptionStore.delete(topicId);
    },
    has: (topicId: TopicId): boolean => subscriptionStore.has(topicId),
    clear: (): void => {
      subscriptionStore.clear();
    },
    update: (
      topicId: TopicId,
      uuid: UUID,
      subscriber?: (payload: any) => void,
    ) => {
      const { subscribers, ...rest } = subscriptionStore.get(topicId)!;
      subscriber ? subscribers.set(uuid, subscriber) : subscribers.delete(uuid);
      subscriptionStore.set(topicId, {
        ...rest,
        subscribers,
      });
    },
  };
}
