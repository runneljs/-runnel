import type { SubscriptionStore } from "./SubscriptionStore";
import type { Plugin, TopicId } from "./primitive-types";

/**
 * Each plugin scope has its own PluginStore.
 */
export class PluginStore {
  constructor(private subscriptionStore: SubscriptionStore) {}
  private plugins: Plugin[] = [];

  addPlugin(plugin: Plugin) {
    this.plugins.push(plugin);
  }

  size() {
    return this.plugins.length;
  }

  pubChain() {
    return chainPlugins(
      this.plugins
        .filter((p) => p.publish !== undefined)
        .map((plugin) => plugin.publish!),
    );
  }

  subChain() {
    return chainPlugins(
      [...this.plugins]
        .reverse()
        .filter((p) => p.subscribe !== undefined)
        .map((plugin) => plugin.subscribe!),
    );
  }

  runAllPluginsForEvent(
    eventName: keyof Plugin,
    topicId?: TopicId,
    payload?: unknown,
  ): void {
    this.plugins.forEach((plugin) => {
      switch (eventName) {
        case "onUnregisterAllTopics":
          plugin[eventName]?.();
          break;
        case "onPublish":
          plugin[eventName]?.(
            topicId!,
            this.subscriptionStore.get(topicId!)!,
            payload,
          );
          break;
        case "onSubscribe":
        case "onUnsubscribe":
          plugin[eventName]?.(topicId!, this.subscriptionStore.get(topicId!)!);
          break;
        default:
          break;
      }
    });
  }
}

type PluginFn = (topicId: TopicId, payload: unknown) => unknown;

export function chainPlugins(funcs: PluginFn[]): PluginFn {
  return (id: string, initialValue: unknown) => {
    return funcs.reduce((currentValue, currentFunction) => {
      return currentFunction(id, currentValue);
    }, initialValue);
  };
}
