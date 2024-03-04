import { chainPlugins, type PluginStore } from "./PluginStore";
import {
  PLUGIN_STORE_VARIABLE_NAME_MAYBE_GLOBAL,
  type PluginStoreMap,
} from "./map-plugins";
import type { Plugin, PluginScope, Scope, TopicId } from "./primitive-types";

const SCOPE_STORE_VARIABLE_NAME = "mfeEventBusPluginScopes" as const;

export type RunPlugins = (
  eventName: keyof Plugin,
  topicId?: string,
  payload?: unknown,
) => void;
export function createRunPlugins(
  pluginStoreMap: PluginStoreMap,
  scope: Scope,
): RunPlugins {
  return function runPlugins(
    eventName: keyof Plugin,
    topicId?: string,
    payload?: unknown,
  ) {
    // Always re-calculate the plugin scopes.
    scope[SCOPE_STORE_VARIABLE_NAME] = uniqueFilter<any>([
      ...(scope[SCOPE_STORE_VARIABLE_NAME]
        ? scope[SCOPE_STORE_VARIABLE_NAME]
        : []),
      ...Array.from(pluginStoreMap.keys()),
    ]);

    scope[SCOPE_STORE_VARIABLE_NAME].forEach((pluginScope: PluginScope) => {
      const pluginStore: PluginStore =
        pluginScope === undefined
          ? pluginStoreMap.get(pluginScope)
          : pluginScope[PLUGIN_STORE_VARIABLE_NAME_MAYBE_GLOBAL];
      pluginStore?.runPluginForEvent(eventName, topicId, payload);
    });
  };
}

/**
 * The plugin events intercept communications between publishers and subscribers.
 * Helpful for logging, monitoring, or modifying the payload.
 */
export function createPluginEventChain(
  pluginStoreMap: PluginStoreMap,
  scope: Scope,
): (topicId: TopicId, payload: unknown) => unknown {
  const chainForEvent = chainAcrossScopes(pluginStoreMap, scope);
  return function eventChain<T extends unknown>(
    topicId: TopicId,
    payload: unknown,
  ): T {
    return chainForEvent("subscribe")(
      topicId,
      chainForEvent("publish")(topicId, payload),
    ) as T;
  };
}

function chainAcrossScopes(pluginStoreMap: PluginStoreMap, scope: Scope) {
  return function chainForEvent(
    eventName: "publish" | "subscribe",
  ): (topicId: TopicId, payload: unknown) => unknown {
    scope[SCOPE_STORE_VARIABLE_NAME] = uniqueFilter<any>([
      ...(scope[SCOPE_STORE_VARIABLE_NAME]
        ? scope[SCOPE_STORE_VARIABLE_NAME]
        : []),
      ...Array.from(pluginStoreMap.keys()),
    ]);

    const pluginChained: Array<
      (topicId: TopicId, payload: unknown) => unknown
    > = [];
    scope[SCOPE_STORE_VARIABLE_NAME].forEach((pluginScope: PluginScope) => {
      const pluginStore: PluginStore =
        pluginScope === undefined
          ? pluginStoreMap.get(pluginScope)
          : pluginScope[PLUGIN_STORE_VARIABLE_NAME_MAYBE_GLOBAL];
      if (pluginStore.size() > 0) {
        if (eventName === "publish") {
          pluginChained.push(pluginStore.pubChain());
        }
        if (eventName === "subscribe") {
          pluginChained.push(pluginStore.subChain());
        }
      }
    });
    return chainPlugins(pluginChained);
  };
}

// Note: Do not use [...new Set()] to get unique - it eliminates undefined/window.
function uniqueFilter<T>(array: T[]): T[] {
  return array.filter((v, i, a) => a.indexOf(v) == i);
}
