import { PluginStore } from "./PluginStore";
import type { SubscriptionStore } from "./SubscriptionStore";
import type { Plugin, PluginScope } from "./primitive-types";

export const PLUGIN_STORE_VARIABLE_NAME_MAYBE_GLOBAL =
  "mfeEventBusPluginStore" as const;
export type PluginStoreMap = Map<PluginScope, PluginStore>;

export function mapPlugins(
  subscriptionStore: SubscriptionStore,
  pluginMap: Map<PluginScope, Plugin[]>,
): PluginStoreMap {
  const pluginStoreMap = new Map<PluginScope, PluginStore>();
  // Mapping plugins to their respective scopes.
  pluginMap.forEach((scopedPlugins, pluginScope) => {
    // catch up with the latest changes.
    pluginStoreMap.set(
      pluginScope,
      pluginScope === undefined
        ? new PluginStore(subscriptionStore)
        : pluginScope[PLUGIN_STORE_VARIABLE_NAME_MAYBE_GLOBAL] ??
            new PluginStore(subscriptionStore),
    );

    // `pluginStore` is a PluginStore instance.
    const pluginStore = pluginStoreMap.get(pluginScope)!;
    scopedPlugins.forEach((plugin) => pluginStore.addPlugin(plugin));
    pluginStoreMap.set(pluginScope, pluginStore);
    if (pluginScope !== undefined) {
      // Also update plugins stores in the global scope.
      pluginScope[PLUGIN_STORE_VARIABLE_NAME_MAYBE_GLOBAL] = pluginStore;
    }
  });

  return pluginStoreMap;
}
