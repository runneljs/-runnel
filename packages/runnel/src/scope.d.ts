import type { SubscriptionStore } from "./SubscriptionStore";
import type { Observable } from "./feat-plugin/observable";
import type { PluginStore } from "./plugin-store";

export type RunnelGlobals = {
  // window, self, global, etc.
  pluginScopes?: GlobalType[];
  // Observe when plugins are registered.
  pluginStoresObservable?: Observable<void>;
  // Store plugins.
  pluginStore?: PluginStore;
  // Store subscribers.
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
