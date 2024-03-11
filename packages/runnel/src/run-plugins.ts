import { chainPlugins, type PluginStore } from "./PluginStore";
import { type PluginStoreMap } from "./map-plugins";
import type { PluginScope, Scope, TopicId } from "./primitive-types";

const SCOPE_STORE_VARIABLE_NAME = "runnelPluginScopes" as const;

export type RunPlugins = (
  eventName:
    | "onCreatePublish"
    | "onCreateSubscribe"
    | "onCreateUnsubscribe"
    | "onUnregisterAllTopics",
  topicId?: string,
  payload?: unknown,
) => void;

export function createRunPlugins(
  pluginStoreMap: PluginStoreMap,
  scope: Scope,
): RunPlugins {
  return function runPlugins(
    eventName:
      | "onCreatePublish"
      | "onCreateSubscribe"
      | "onCreateUnsubscribe"
      | "onUnregisterAllTopics",
    topicId?: string,
    payload?: unknown,
  ) {
    /**
     * Always re-calculate the plugin scopes when we add plugins.
     * Then re-calculate the plugin stores,
     * so we don't miss plugins across micro frontends.
     */
    const pluginStores: PluginStore[] = recalcPluginScopes(
      scope,
      pluginStoreMap,
    )
      .map(getPluginStoreByScope(pluginStoreMap))
      .filter(Boolean);

    pluginStores.forEach((pluginStore) => {
      pluginStore.runPluginForEvent(eventName, topicId, payload);
    });
  };
}

export function createPluginEmitter(
  pluginStoreMap: PluginStoreMap,
  scope: Scope,
) {
  /**
   * Always re-calculate the plugin scopes when we add plugins.
   * Then re-calculate the plugin stores,
   * so we don't miss plugins across micro frontends.
   */
  const getPluginStores: PluginStore[] = recalcPluginScopes(
    scope,
    pluginStoreMap,
  )
    .map(getPluginStoreByScope(pluginStoreMap))
    .filter(Boolean); // There can be scopes that do not have a pluginStore.

  return {
    onCreatePublish: (topicId: TopicId, payload: unknown) => {
      getPluginStores.forEach((pluginStore) => {
        pluginStore.onCreatePublishEvent(topicId, payload);
      });
    },
    onCreateSubscribe: (topicId: TopicId) => {
      getPluginStores.forEach((pluginStore) => {
        pluginStore.onCreateSubscribeEvent(topicId);
      });
    },
    onCreateUnsubscribe: (topicId: TopicId) => {
      getPluginStores.forEach((pluginStore) => {
        pluginStore.onCreateUnsubscribeEvent(topicId);
      });
    },
    onUnregisterAllTopics: () => {
      getPluginStores.forEach((pluginStore) => {
        pluginStore.onUnregisterAllTopicsEvent();
      });
    },
    subscribe: chainPlugins(
      getPluginStores.reduce<
        Array<(topicId: TopicId, payload: unknown) => unknown>
      >((acc, pluginStore) => {
        if (pluginStore.size("subscribe") > 0) {
          acc.push(pluginStore.subscribeEvent());
        }
        return acc;
      }, []),
    ),
    publish: chainPlugins(
      getPluginStores.reduce<
        Array<(topicId: TopicId, payload: unknown) => unknown>
      >((acc, pluginStore) => {
        if (pluginStore.size("publish") > 0) {
          acc.push(pluginStore.publishEvent());
        }
        return acc;
      }, []),
    ),
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
    // Always re-calculate the plugin scopes.
    const pluginStores: PluginStore[] = recalcPluginScopes(
      scope,
      pluginStoreMap,
    )
      .map(getPluginStoreByScope(pluginStoreMap))
      .filter(Boolean);

    const pluginPubOrSub = pluginStores.reduce<
      Array<(topicId: TopicId, payload: unknown) => unknown>
    >((acc, pluginStore) => {
      if (pluginStore.size() > 0) {
        acc.push(pluginStore[`${eventName}Event`]());
      }
      return acc;
    }, []);
    return chainPlugins(pluginPubOrSub);
  };
}

function getPluginStoreByScope(pluginStoreMap: PluginStoreMap) {
  return function (pluginScope: PluginScope): PluginStore {
    return pluginStoreMap.get(pluginScope)!;
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
