import { PayloadMismatchError, SchemaMismatchError } from "./errors";
import { eventBus, type DeepEqual, type Validator } from "./event-bus";
import { createRunPlugins, mapPlugIns, type PlugIn } from "./plugin-store";
import { type Scope, type TopicId } from "./primitive-types";
import { initSubscriptionStore, type Subscription } from "./subscription-store";

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
  _global.mfeEventBusSubscriptionStore ??= initSubscriptionStore();
  const subscriptionStore = _global.mfeEventBusSubscriptionStore;

  return eventBus({
    deepEqual,
    payloadValidator,
    subscriptionStore,
    runPlugins: createRunPlugins(
      mapPlugIns(subscriptionStore, plugins),
      _global,
    ),
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
