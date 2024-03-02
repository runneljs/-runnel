import type { Scope, TopicId } from "./primitive-types";
import type { Subscription, SubscriptionStore } from "./subscription-store";

const SCOPE_STORE_VARIABLE_NAME = "mfeEventBusPlugInScopes" as const;
const PLUGIN_STORE_VARIABLE_NAME_MAYBE_GLOBAL =
  "mfeEventBusPluginStore" as const;

export type PlugIn = {
  onSubscribe?: (topicId: TopicId, subscription: Subscription) => void;
  onUnsubscribe?: (topicId: TopicId, subscription: Subscription) => void;
  onPublish?: (
    topicId: TopicId,
    subscription: Subscription,
    payload: unknown,
  ) => void;
  onUnregisterAllTopics?: () => void;
};
export type PlugInScope = any; // r.g., window, global, self, window.parent, window.top, etc.

type PluginStoreMap = Map<PlugInScope, PlugInStore>;
export function mapPlugIns(
  subscriptionStore: SubscriptionStore,
  plugins: Array<PlugIn | [PlugInScope, PlugIn[]]>,
): PluginStoreMap {
  // Mapping plugins to their respective scopes.
  const pluginStoreMap = new Map<PlugInScope, PlugInStore>();
  plugins.forEach((pluginOrScopedPlugins) => {
    const [plugInScope, plugins] = Array.isArray(pluginOrScopedPlugins)
      ? pluginOrScopedPlugins
      : [undefined, [pluginOrScopedPlugins]];
    if (plugInScope !== undefined) {
      plugInScope[PLUGIN_STORE_VARIABLE_NAME_MAYBE_GLOBAL] ??= new PlugInStore(
        subscriptionStore,
      );
    }
    const pluginStore =
      plugInScope === undefined
        ? new PlugInStore(subscriptionStore)
        : plugInScope[PLUGIN_STORE_VARIABLE_NAME_MAYBE_GLOBAL];
    if (!pluginStoreMap.has(plugInScope)) {
      pluginStoreMap.set(plugInScope, pluginStore);
    }
    plugins.forEach((plugin) => pluginStore.add(plugin));
    pluginStoreMap.set(plugInScope, pluginStore);
  });

  return pluginStoreMap;
}

export type RunPlugIns = (
  eventName: keyof PlugIn,
  topicId?: string,
  payload?: unknown,
) => void;
export function createRunPlugins(
  plugInStoreMap: PluginStoreMap,
  scope: Scope,
): RunPlugIns {
  return function runPlugins(
    eventName: keyof PlugIn,
    topicId?: string,
    payload?: unknown,
  ) {
    // Always re-calculate the plugin scopes.
    scope[SCOPE_STORE_VARIABLE_NAME] = uniqueFilter<any>([
      ...(scope[SCOPE_STORE_VARIABLE_NAME]
        ? scope[SCOPE_STORE_VARIABLE_NAME]
        : []),
      ...Array.from(plugInStoreMap.keys()),
    ]);

    scope[SCOPE_STORE_VARIABLE_NAME].forEach((plugInScope: PlugInScope) => {
      const plugIn =
        plugInScope === undefined
          ? plugInStoreMap.get(plugInScope)
          : plugInScope[PLUGIN_STORE_VARIABLE_NAME_MAYBE_GLOBAL];
      plugIn?.run(eventName, topicId, payload);
    });
  };
}

/**
 * The instance is bound to a specific plugIn scope.
 */
class PlugInStore {
  constructor(private subscriptionStore: SubscriptionStore) {}
  private plugIns: PlugIn[] = [];

  add(plugin: PlugIn) {
    this.plugIns.push(plugin);
  }

  run(eventName: keyof PlugIn, topicId?: TopicId, payload?: unknown): void {
    this.plugIns.forEach((plugin) => {
      switch (eventName) {
        case "onUnregisterAllTopics":
          plugin[eventName]?.();
          break;
        case "onPublish":
          plugin[eventName]?.(
            topicId!,
            this.subscriptionStore.get(topicId!)!,
            payload,
          );
          break;
        default:
          plugin[eventName]?.(topicId!, this.subscriptionStore.get(topicId!)!);
          break;
      }
    });
  }
}

// Note: Do not use [...new Set()] to get unique - it eliminates undefined/window.
function uniqueFilter<T>(array: T[]): T[] {
  return array.filter((v, i, a) => a.indexOf(v) == i);
}
