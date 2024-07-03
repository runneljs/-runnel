import type { SubscriptionStore } from "./eventbus/SubscriptionStore";

export type RunnelGlobals = {
  // Observe when plugins are registered.
  subscriptionStore?: SubscriptionStore;
  // Store schemas so we can validate schema and payload.
  schemaStoreMap?: Map<TopicId, JsonSchema>;
  // For new subscribers which subscribe to a topic already published.
  latestStateStoreMap?: Map<TopicId, unknown>;
};

interface CustomWindow extends Window {
  __runnel: RunnelGlobals;
}
declare const window: CustomWindow;
type GlobalType = CustomWindow;
