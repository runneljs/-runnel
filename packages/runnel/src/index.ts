import { SubscriptionStore } from "./SubscriptionStore";
import { PayloadMismatchError, SchemaMismatchError } from "./errors";
import { eventBus, type Validator } from "./event-bus";
import { getGlobal } from "./get-global";
import { mapPlugins } from "./map-plugins";
import { createPluginEmitter } from "./plugin-emitter";
import type {
  JsonSchema,
  Plugin,
  PluginScope,
  Subscription,
  TopicId,
} from "./primitive-types";
import { schemaManager, type DeepEqual } from "./schema-manager";
import type { GlobalType, Scope } from "./scope";
import { createGetSynchedPluginStores } from "./sync-plugins";
export { type Plugin };

export { PayloadMismatchError, SchemaMismatchError };
export type { Subscription, TopicId };

export function createEventBus({
  deepEqual,
  payloadValidator,
  globalVar = getGlobal(),
  scope = getGlobal(), // deprecated. Removed soon.
  pluginMap = new Map<any, Plugin[]>(),
}: {
  deepEqual: DeepEqual;
  payloadValidator: Validator;
  globalVar?: GlobalType;
  scope?: GlobalType; // deprecated. Removed soon.
  pluginMap?: Map<PluginScope, Plugin[]>;
}): ReturnType<typeof eventBus> {
  const _runnel = (globalVar.__runnel ??= {} as Scope);
  _runnel.subscriptionStore ??= new SubscriptionStore();
  _runnel.schemaStoreMap ??= new Map<TopicId, JsonSchema>();
  _runnel.latestStateStoreMap ??= new Map<TopicId, unknown>();

  const pluginStoreMap = mapPlugins(_runnel.schemaStoreMap, pluginMap);

  return eventBus({
    latestStateStore: _runnel.latestStateStoreMap,
    subscriptionStore: _runnel.subscriptionStore,
    checkSchema: schemaManager(deepEqual, _runnel.schemaStoreMap),
    pluginEmitter: createPluginEmitter(
      createGetSynchedPluginStores(pluginStoreMap, _runnel),
      _runnel,
    ),
    payloadValidator,
  });
}
