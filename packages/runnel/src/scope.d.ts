import type { SubscriptionStore } from "./SubscriptionStore";
import type { Observable } from "./observable";
import type { PluginStore } from "./plugin-store";

export type RunnelGlobals = {
  pluginScopes?: any[];
  pluginStoresObservable?: Observable<void>;
  pluginStore?: PluginStore;
  subscriptionStore?: SubscriptionStore;
  schemaStoreMap?: Map<TopicId, JsonSchema>;
  latestStateStoreMap?: Map<TopicId, unknown>;
};

interface CustomWindow extends Window {
  __runnel: RunnelGlobals;
}
declare const window: CustomWindow;
type GlobalType = CustomWindow;
