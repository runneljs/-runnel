import type { SubscriptionStore } from "./SubscriptionStore";
import type { Observable } from "./observable";

export type Scope = {
  runnelPluginScopes?: any[];
  runnelPluginStores?: Observable<void>;
  runnelSubscriptionStore?: SubscriptionStore;
  runnelSchemaStore?: Map<TopicId, JsonSchema>;
  runnelLatestStateStore?: Map<TopicId, unknown>;
}; // r.g., window, global, self, window.parent, window.top, etc.
