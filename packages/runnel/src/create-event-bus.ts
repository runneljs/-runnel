import { SubscriptionStore } from "./SubscriptionStore";
import { eventBus, type EventBus, type Validator } from "./event-bus";
import { getGlobal } from "./get-global";
import { mapPlugins } from "./map-plugins";
import { createPluginEmitter } from "./plugin-emitter";
import type {
  JsonSchema,
  Plugin,
  PluginScope,
  TopicId,
} from "./primitive-types";
import { schemaManager, type DeepEqual } from "./schema-manager";
import type { GlobalType, RunnelGlobals } from "./scope";
import { createGetSynchedPluginStores } from "./sync-plugins";

export function createEventBus({
  deepEqual,
  payloadValidator,
  globalVar = getGlobal(),
  scope = getGlobal(),
  pluginMap = new Map<any, Plugin[]>(),
}: {
  deepEqual: DeepEqual;
  payloadValidator: Validator;
  globalVar?: GlobalType;
  scope?: GlobalType; // deprecated. Removed soon.
  pluginMap?: Map<PluginScope, Plugin[]>;
}): EventBus {
  const _runnel = ((globalVar ?? scope).__runnel ??= {} as RunnelGlobals);
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
