import { PluginStore } from "./PluginStore";
import type { Plugin, PluginScope } from "./primitive-types";

export type PluginStoreMap = Map<PluginScope, PluginStore>;
export type PluginMap = Map<PluginScope, Plugin[]>;

export function mapPlugins(pluginMap: PluginMap): PluginStoreMap {
  const pluginStoreMap = new Map<PluginScope, PluginStore>();
  // Mapping plugins to their respective scopes.
  pluginMap.forEach((scopedPlugins, pluginScope) => {
    // catch up with the latest changes.
    pluginStoreMap.set(
      pluginScope,
      pluginScope === undefined
        ? new PluginStore()
        : pluginScope.pluginStore ?? new PluginStore(),
    );

    // `pluginStore` is a PluginStore instance.
    const pluginStore = pluginStoreMap.get(pluginScope)!;
    scopedPlugins.forEach((plugin) => pluginStore.addPlugin(plugin));
    pluginStoreMap.set(pluginScope, pluginStore);
    if (pluginScope !== undefined) {
      // Also update plugins stores in the global scope.
      pluginScope.pluginStore = pluginStore;
    }
  });

  return pluginStoreMap;
}
