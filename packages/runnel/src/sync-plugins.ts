import { type PluginStore } from "./PluginStore";
import {
  PLUGIN_STORE_VARIABLE_NAME_MAYBE_GLOBAL,
  type PluginStoreMap,
} from "./map-plugins";
import type { PluginScope } from "./primitive-types";
import type { Scope } from "./scope";

const SCOPE_STORE_VARIABLE_NAME = "runnelPluginScopes" as const;

export function createGetSynchedPluginStores(
  pluginStoreMap: PluginStoreMap,
  scope: Scope,
) {
  return function getSynchedPluginStores() {
    return recalcPluginScopes(scope, pluginStoreMap).reduce<PluginStore[]>(
      (acc, pluginScope) => {
        const pluginStore =
          pluginScope === undefined
            ? pluginStoreMap.get(pluginScope)
            : // Fetch the plugin store from the global scope.
              pluginScope[PLUGIN_STORE_VARIABLE_NAME_MAYBE_GLOBAL];
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
  scope: Scope,
  pluginStoreMap: PluginStoreMap,
): PluginScope[] {
  scope[SCOPE_STORE_VARIABLE_NAME] = uniqueFilter<any>([
    ...(scope[SCOPE_STORE_VARIABLE_NAME]
      ? scope[SCOPE_STORE_VARIABLE_NAME]
      : []),
    ...Array.from(pluginStoreMap.keys()),
  ]);
  return scope[SCOPE_STORE_VARIABLE_NAME];
}

// Note: Do not use [...new Set()] to get unique - it eliminates undefined/window.
function uniqueFilter<T>(array: T[]): T[] {
  return array.filter((v, i, a) => a.indexOf(v) == i);
}
