import { PluginStore } from "./PluginStore";
import type {
  JsonSchema,
  Plugin,
  PluginScope,
  TopicId,
} from "./primitive-types";

export type PluginStoreMap = Map<PluginScope, PluginStore>;

export function mapPlugins(
  schemaStore: Map<TopicId, JsonSchema>,
  pluginMap: Map<PluginScope, Plugin[]>,
): PluginStoreMap {
  const pluginStoreMap = new Map<PluginScope, PluginStore>();
  // Mapping plugins to their respective scopes.
  pluginMap.forEach((scopedPlugins, pluginScope) => {
    // catch up with the latest changes.
    pluginStoreMap.set(
      pluginScope,
      pluginScope === undefined
        ? new PluginStore(schemaStore)
        : pluginScope.pluginStore ?? new PluginStore(schemaStore),
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
