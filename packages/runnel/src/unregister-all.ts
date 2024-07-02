import type { SubscriptionStore } from "./SubscriptionStore";
import type { PluginEmitter } from "./feat-plugin/plugin-emitter";

export type UnregisterAllTopics = () => void;

export function createUnregisterAllTopics(
  latestStateStore: Map<string, unknown>,
  pluginEmitter: PluginEmitter,
  subscriptionStore: SubscriptionStore,
): UnregisterAllTopics {
  return function unregisterAllTopics(): void {
    if (subscriptionStore.size !== 0) {
      subscriptionStore.clear();
      latestStateStore.clear();
      pluginEmitter.onUnregisterAllTopics();
    }
  };
}
