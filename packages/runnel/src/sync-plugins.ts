import { type PluginStore } from "./PluginStore";
import { type PluginStoreMap } from "./map-plugins";
import type { PluginScope } from "./primitive-types";
import type { RunnelGlobals } from "./scope";

export function createGetSynchedPluginStores(
  pluginStoreMap: PluginStoreMap,
  scope: RunnelGlobals,
): () => PluginStore[] {
  return function getSynchedPluginStores() {
    return recalcPluginScopes(scope, pluginStoreMap).reduce<PluginStore[]>(
      (acc, pluginScope) => {
        const pluginStore =
          pluginScope === undefined
            ? pluginStoreMap.get(pluginScope)
            : // Fetch the plugin store from the global scope.
              pluginScope.pluginStore;
        if (pluginStore !== undefined) {
          acc.push(pluginStore);
        }
        return acc;
      },
      [],
    );
  };
}

function recalcPluginScopes(
  scope: RunnelGlobals,
  pluginStoreMap: PluginStoreMap,
): PluginScope[] {
  scope.pluginScopes = uniqueFilter<any>([
    ...(scope.pluginScopes ? scope.pluginScopes : []),
    ...Array.from(pluginStoreMap.keys()),
  ]);
  return scope.pluginScopes;
}

// Note: Do not use [...new Set()] to get unique - it eliminates undefined/window.
function uniqueFilter<T>(array: T[]): T[] {
  return array.filter((v, i, a) => a.indexOf(v) == i);
}
