import { PayloadMismatchError, SchemaMismatchError } from "./errors";
import { eventBus, type DeepEqual, type Validator } from "./event-bus";
import { createRunPlugins, mapPlugIns, type PlugIn } from "./plugin-store";
import { type Scope, type TopicId } from "./primitive-types";
import { initSubscriptionStore, type Subscription } from "./subscription-store";

const SUBSCRIPTION_STORE_VARIABLE_NAME =
  "mfeEventBusSubscriptionStore" as const;
const LATEST_STATE_STORE_VARIABLE_NAME = "mfeEventBusLatestStateStore" as const;

export { PayloadMismatchError, SchemaMismatchError };
export type { Subscription, TopicId };

export function createEventBus({
  deepEqual,
  payloadValidator,
  scope = getGlobal(),
  plugins = [],
}: {
  deepEqual: DeepEqual;
  payloadValidator: Validator;
  scope?: Scope;
  plugins?: Array<PlugIn | [Scope, PlugIn[]]>;
}): ReturnType<typeof eventBus> {
  const _global = scope;
  _global[SUBSCRIPTION_STORE_VARIABLE_NAME] ??= initSubscriptionStore();
  _global[LATEST_STATE_STORE_VARIABLE_NAME] ??= new Map<TopicId, unknown>();

  return eventBus({
    latestStateStore: _global[LATEST_STATE_STORE_VARIABLE_NAME],
    subscriptionStore: _global[SUBSCRIPTION_STORE_VARIABLE_NAME],
    runPlugIns: createRunPlugins(
      mapPlugIns(_global[SUBSCRIPTION_STORE_VARIABLE_NAME], plugins),
      _global,
    ),
    deepEqual,
    payloadValidator,
  });
}

function getGlobal() {
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  throw new Error("No global object found. Please create a PR to support it.");
}

export default createEventBus;
