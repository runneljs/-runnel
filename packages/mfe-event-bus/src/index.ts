import { PayloadMismatchError, SchemaMismatchError } from "./errors";
import { eventBus, type DeepEqual, type Validator } from "./event-bus";
import { initPluginStore, type InitPlugIn } from "./plugin-store";
import { initSubscriptionStore } from "./subscription-store";

export { PayloadMismatchError, SchemaMismatchError };

export function createEventBus({
  deepEqual,
  payloadValidator,
  scope = getGlobal(),
  plugins = {},
}: {
  deepEqual: DeepEqual;
  payloadValidator: Validator;
  scope?: any;
  plugins?: Record<string, InitPlugIn>;
}): ReturnType<typeof eventBus> {
  const _global = scope || (getGlobal() as any);
  _global.mfeEventBusSubscriptionStore ??= initSubscriptionStore();
  const subscriptionStore = _global.mfeEventBusSubscriptionStore;
  const pluginStore = initPluginStore({ subscriptionStore, plugins });

  return eventBus({
    deepEqual,
    payloadValidator,
    subscriptionStore,
    pluginStore,
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
