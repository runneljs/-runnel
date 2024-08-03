import type { Validator } from "../bc/payload-validator";
import { createPayloadValidator } from "../bc/payload-validator";
import { createSchemaManager, type DeepEqual } from "../bc/schema-manager";
import {
  buildReceiver,
  buildSender,
  type JsonSchema,
  type TopicId,
} from "../bc/topic-registration";
import { getGlobal, type GlobalType, type RunnelGlobals } from "../get-global";
import { eventBus, type EventBus } from "./event-bus";
import { SubscriptionStore } from "./SubscriptionStore";

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

  return eventBus({
    latestStateStore,
    subscriptionStore: _runnel.subscriptionStore,
    schemaManager: createSchemaManager(deepEqual, _runnel.schemaStoreMap),
    sender: buildSender(
      latestStateStore,
      createPayloadValidator(payloadValidator),
    ),
    receiver: buildReceiver(latestStateStore),
  });
}
