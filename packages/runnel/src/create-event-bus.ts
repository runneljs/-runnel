import { SubscriptionStore } from "./SubscriptionStore";
import { eventBus, type EventBus } from "./event-bus";
import { mapPlugins, type PluginMap } from "./feat-plugin/map-plugins";
import { createPluginEmitter } from "./feat-plugin/plugin-emitter";
import { createGetSynchedPluginStores } from "./feat-plugin/sync-plugins";
import { schemaManager, type DeepEqual } from "./feat-schema/schema-manager";
import { getGlobal } from "./get-global";
import type { Validator } from "./payload-validator";
import { createPayloadValidator } from "./payload-validator";
import type { JsonSchema, Plugin, TopicId } from "./primitive-types";
import type { GlobalType, RunnelGlobals } from "./scope";
import { buildReceiver, buildSender } from "./topic-registration";

export function createEventBus({
  deepEqual,
  payloadValidator,
  globalVar = getGlobal(),
  pluginMap = new Map<any, Plugin[]>(),
}: {
  deepEqual: DeepEqual;
  payloadValidator: Validator;
  globalVar?: GlobalType;
  pluginMap?: PluginMap;
}): EventBus {
  const _runnel = (globalVar.__runnel ??= {} as RunnelGlobals);
  _runnel.subscriptionStore ??= new SubscriptionStore();
  _runnel.schemaStoreMap ??= new Map<TopicId, JsonSchema>();
  _runnel.latestStateStoreMap ??= new Map<TopicId, unknown>();

  const latestStateStore = _runnel.latestStateStoreMap;
  const pluginEmitter = createPluginEmitter(
    createGetSynchedPluginStores(mapPlugins(pluginMap), _runnel),
    _runnel,
  );
  const sender = buildSender(
    latestStateStore,
    pluginEmitter,
    createPayloadValidator(payloadValidator),
  );
  const receiver = buildReceiver(latestStateStore, pluginEmitter);

  return eventBus({
    latestStateStore,
    subscriptionStore: _runnel.subscriptionStore,
    schemaManager: schemaManager(deepEqual, _runnel.schemaStoreMap),
    pluginEmitter,
    sender,
    receiver,
  });
}
