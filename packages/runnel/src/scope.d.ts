import type { SubscriptionStore } from "./SubscriptionStore";
import type { Observable } from "./observable";

export type Scope = {
  pluginScopes?: any[];
  pluginStoresObservable?: Observable<void>;
  subscriptionStore?: SubscriptionStore;
  schemaStoreMap?: Map<TopicId, JsonSchema>;
  latestStateStoreMap?: Map<TopicId, unknown>;
};

declare global {
  var __runnel: Scope;
}

type GlobalType = typeof globalThis;
