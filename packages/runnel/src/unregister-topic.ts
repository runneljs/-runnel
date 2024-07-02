import type { SubscriptionStore } from "./SubscriptionStore";
import { TopicNotFoundError } from "./errors";
import { topicNameToId, type TopicName } from "./topic-name-to-id";

export type UnregisterTopic = (
  topicName: TopicName,
  options?: { version?: number },
) => void;

export function createUnregisterTopic(
  latestStateStore: Map<string, unknown>,
  subscriptionStore: SubscriptionStore,
): UnregisterTopic {
  return function unregisterTopic(
    topicName: TopicName,
    options?: { version?: number },
  ): void {
    const { version } = options ?? {};
    const topicId = topicNameToId(topicName, version);
    if (subscriptionStore.has(topicId)) {
      subscriptionStore.delete(topicId);
      latestStateStore.delete(topicId);
    } else {
      throw new TopicNotFoundError(topicId);
    }
  };
}
