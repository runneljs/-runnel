import type { SubscriptionStore } from "./SubscriptionStore";
import type { Observable } from "./observable";

export type Scope = {
  pluginScopes?: any[];
  pluginStoresObservable?: Observable<void>;
  subscriptionStore?: SubscriptionStore;
  schemaStoreMap?: Map<TopicId, JsonSchema>;
  latestStateStoreMap?: Map<TopicId, unknown>;
};

interface CustomWindow extends Window {
  __runnel: Scope;
}
declare const window: CustomWindow;
type GlobalType = CustomWindow;
