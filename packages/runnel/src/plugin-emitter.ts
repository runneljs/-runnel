import { chainPlugins, type PluginStore } from "./PluginStore";
import {
  PLUGIN_STORE_VARIABLE_NAME_MAYBE_GLOBAL,
  type PluginStoreMap,
} from "./map-plugins";
import type { PluginScope, Scope, TopicId } from "./primitive-types";
const SCOPE_STORE_VARIABLE_NAME = "runnelPluginScopes" as const;

export function createPluginEmitter(
  pluginStoreMap: PluginStoreMap,
  scope: Scope,
) {
  /**
   * Always re-calculate the plugin scopes when we add plugins.
   * Then re-calculate the plugin stores,
   * so we don't miss plugins across micro frontends.
   */
  const getPluginStoreByScope = createGetPluginStoreByScope(pluginStoreMap);
  const getPluginStores: () => PluginStore[] = () =>
    recalcPluginScopes(scope, pluginStoreMap).reduce<PluginStore[]>(
      (acc, pluginScope) => {
        const pluginStore = getPluginStoreByScope(pluginScope);
        if (pluginStore !== undefined) {
          acc.push(pluginStore);
        }
        return acc;
      },
      [],
    );

  return {
    onCreatePublish: (topicId: TopicId, payload: unknown) => {
      getPluginStores().forEach((pluginStore) => {
        pluginStore.onCreatePublishEvent(topicId, payload);
      });
    },
    onCreateSubscribe: (topicId: TopicId) => {
      getPluginStores().forEach((pluginStore) => {
        pluginStore.onCreateSubscribeEvent(topicId);
      });
    },
    onCreateUnsubscribe: (topicId: TopicId) => {
      getPluginStores().forEach((pluginStore) => {
        pluginStore.onCreateUnsubscribeEvent(topicId);
      });
    },
    onUnregisterAllTopics: () => {
      getPluginStores().forEach((pluginStore) => {
        pluginStore.onUnregisterAllTopicsEvent();
      });
    },
    subscribe: chainPlugins(
      getPluginStores().reduce<
        Array<(topicId: TopicId, payload: unknown) => unknown>
      >((acc, pluginStore) => {
        if (pluginStore.size("subscribe") > 0) {
          acc.push(pluginStore.subscribeEvent());
        }
        return acc;
      }, []),
    ),
    /**
     * TODO: I don't know why the code block below breaks tests in `index.test.ts`.
     */
    // subscribe: (topicId: TopicId, payload: unknown) => {
    //   return chainPlugins(
    //     getPluginStores().reduce<
    //       Array<(topicId: TopicId, payload: unknown) => unknown>
    //     >((acc, pluginStore) => {
    //       if (pluginStore.size("subscribe") > 0) {
    //         acc.push(pluginStore.subscribeEvent());
    //       }
    //       return acc;
    //     }, []),
    //   )(topicId, payload);
    // },
    publish: (topicId: TopicId, payload: unknown) => {
      return chainPlugins(
        getPluginStores().reduce<
          Array<(topicId: TopicId, payload: unknown) => unknown>
        >((acc, pluginStore) => {
          if (pluginStore.size("publish") > 0) {
            acc.push(pluginStore.publishEvent());
          }
          return acc;
        }, []),
      )(topicId, payload);
    },
  };
}

function createGetPluginStoreByScope(pluginStoreMap: PluginStoreMap) {
  return function getPluginStoreByScope(
    pluginScope: PluginScope,
  ): PluginStore | undefined {
    return pluginScope === undefined
      ? pluginStoreMap.get(pluginScope)
      : // Fetch the plugin store from the global scope.
        pluginScope[PLUGIN_STORE_VARIABLE_NAME_MAYBE_GLOBAL];
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
