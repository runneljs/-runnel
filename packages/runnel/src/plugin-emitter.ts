import { chainPlugins, type PluginStore } from "./PluginStore";
import { Observable } from "./observable";
import type { TopicId } from "./primitive-types";
import type { Scope } from "./scope";

const PLUGIN_STORES_VARIABLE_NAME = "runnelPluginStores" as const;

// TODO: Lifecycle support. What to do when the micro frontend is unmounted?
export function createPluginEmitter(
  getSynchedPluginStores: () => PluginStore[],
  scope: Scope,
) {
  let _pluginStores: PluginStore[] = getSynchedPluginStores();

  // Observe other instances.
  scope[PLUGIN_STORES_VARIABLE_NAME] ??= new Observable<void>();
  scope[PLUGIN_STORES_VARIABLE_NAME].subscribe(() => {
    /**
     * Re-calculate the plugin scopes when we add plugins.
     * Then re-calculate the plugin stores,
     * so we don't miss plugins across micro frontends.
     */
    _pluginStores = getSynchedPluginStores();
  });
  scope[PLUGIN_STORES_VARIABLE_NAME].notify();

  const getPluginStores: () => PluginStore[] = () => {
    return _pluginStores;
  };

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
    subscribe: (topicId: TopicId, payload: unknown) => {
      return chainPlugins(
        getPluginStores().reduce<
          Array<(topicId: TopicId, payload: unknown) => unknown>
        >((acc, pluginStore) => {
          if (pluginStore.size("subscribe") > 0) {
            acc.push(pluginStore.subscribeEvent());
          }
          return acc;
        }, []),
      )(topicId, payload);
    },
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
