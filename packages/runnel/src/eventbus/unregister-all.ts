import { dispatchOnUnregisterAllTopics } from "../bc/dispatch-events";
import type { SubscriptionStore } from "./SubscriptionStore";

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
