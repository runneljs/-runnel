import type { Scope, TopicId } from "./primitive-types";
import type { Subscription, SubscriptionStore } from "./subscription-store";

export type PlugIn = {
  onSubscribe?: (topicId: TopicId, subscription: Subscription) => void;
  onUnsubscribe?: (topicId: TopicId, subscription: Subscription) => void;
  onPublish?: (topicId: TopicId, subscription: Subscription) => void;
  onUnregisterAllTopics?: () => void;
};
export type PlugInStore = ReturnType<typeof initPluginStore>;

export function initPluginStore({
  subscriptionStore,
}: {
  subscriptionStore: SubscriptionStore;
}) {
  const plugins: Array<PlugIn> = [];

  return {
    run: (eventName: keyof PlugIn, topicId?: TopicId): void => {
      plugins.forEach((plugin) => {
        eventName === "onUnregisterAllTopics"
          ? plugin[eventName]?.()
          : plugin[eventName]?.(topicId!, subscriptionStore.get(topicId!)!);
      });
    },
    add: (plugin: PlugIn) => {
      plugins.push(plugin);
    },
  };
}

export type PlugInScope = any; // r.g., window, global, self, window.parent, window.top, etc.
type PluginStoreMap = Map<PlugInScope, PlugInStore>;

export function mapPlugIns(
  subscriptionStore: SubscriptionStore,
  plugins: Array<PlugIn | [PlugInScope, PlugIn[]]>,
): PluginStoreMap {
  // Mapping plugins to their respective scopes.
  const pluginStoreMap = new Map<PlugInScope, PlugInStore>();
  plugins.forEach((pluginOrScopedPlugins) => {
    const [scope, plugins] = Array.isArray(pluginOrScopedPlugins)
      ? pluginOrScopedPlugins
      : [undefined, [pluginOrScopedPlugins]];
    let pluginStore: PlugInStore;
    if (scope === undefined) {
      pluginStore = initPluginStore({ subscriptionStore });
    } else {
      scope.mfeEventBusPluginStore ??= initPluginStore({
        subscriptionStore,
      });
      pluginStore = scope.mfeEventBusPluginStore;
    }
    if (!pluginStoreMap.has(scope)) {
      pluginStoreMap.set(scope, pluginStore);
    }
    plugins.forEach((plugin) => pluginStore.add(plugin));
    pluginStoreMap.set(scope, pluginStore);
  });

  return pluginStoreMap;
}

export function createRunPlugins(plugInStoreMap: PluginStoreMap, scope: Scope) {
  return function runPlugins(eventName: keyof PlugIn, topicId?: string) {
    // Always re-calculate the plugin scopes.
    scope.plugInScopes = uniqueFilter([
      ...(scope.plugInScopes ? scope.plugInScopes : []),
      ...Array.from(plugInStoreMap.keys()),
    ]);

    uniqueFilter([...scope.plugInScopes]).forEach((scope) => {
      scope === undefined
        ? plugInStoreMap.get(scope)?.run(eventName, topicId)
        : scope.mfeEventBusPluginStore?.run(eventName, topicId);
    });
  };
}

// Note: Do not use [...new Set()] to get unique - it eliminates undefined/window.
function uniqueFilter<T>(array: T[]): T[] {
  return array.filter((v, i, a) => a.indexOf(v) == i);
}
