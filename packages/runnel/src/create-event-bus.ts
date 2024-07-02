import { SubscriptionStore } from "./SubscriptionStore";
import { eventBus, type EventBus } from "./event-bus";
import { schemaManager, type DeepEqual } from "./feat-schema/schema-manager";
import { getGlobal } from "./get-global";
import type { Validator } from "./payload-validator";
import { createPayloadValidator } from "./payload-validator";
import type { JsonSchema, TopicId } from "./primitive-types";
import type { GlobalType, RunnelGlobals } from "./scope";
import { buildReceiver, buildSender } from "./topic-registration";

export function createEventBus({
  deepEqual,
  payloadValidator,
  globalVar = getGlobal(),
}: {
  deepEqual: DeepEqual;
  payloadValidator: Validator;
  globalVar?: GlobalType;
}): EventBus {
  const _runnel = (globalVar.__runnel ??= {} as RunnelGlobals);
  _runnel.subscriptionStore ??= new SubscriptionStore();
  _runnel.schemaStoreMap ??= new Map<TopicId, JsonSchema>();
  _runnel.latestStateStoreMap ??= new Map<TopicId, unknown>();

  const latestStateStore = _runnel.latestStateStoreMap;
  const sender = buildSender(
    latestStateStore,
    createPayloadValidator(payloadValidator),
  );
  const receiver = buildReceiver(latestStateStore);

  return eventBus({
    latestStateStore,
    subscriptionStore: _runnel.subscriptionStore,
    schemaManager: schemaManager(deepEqual, _runnel.schemaStoreMap),
    sender,
    receiver,
  });
}
