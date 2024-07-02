import type { SubscriptionStore } from "./SubscriptionStore";
import { dispatchOnUnregisterAllTopics } from "./dispatch-events";

export type UnregisterAllTopics = () => void;

export function createUnregisterAllTopics(
  latestStateStore: Map<string, unknown>,
  subscriptionStore: SubscriptionStore,
): UnregisterAllTopics {
  return function unregisterAllTopics(): void {
    if (subscriptionStore.size !== 0) {
      subscriptionStore.clear();
      latestStateStore.clear();
      dispatchOnUnregisterAllTopics();
    }
  };
}
