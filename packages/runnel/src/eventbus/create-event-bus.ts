import {
  createSchemaManager,
  type DeepEqual,
} from "../feat-schema/schema-manager";
import { getGlobal } from "../get-global";
import type { Validator } from "../payload-validator";
import { createPayloadValidator } from "../payload-validator";
import type { JsonSchema, TopicId } from "../primitive-types";
import type { GlobalType, RunnelGlobals } from "../scope";
import { buildReceiver, buildSender } from "../topic-registration";
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
