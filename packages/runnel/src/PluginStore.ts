import type { Plugin, TopicId } from "./primitive-types";

const pluginEventNames = [
  "publish",
  "subscribe",
  "onCreatePublish",
  "onCreateSubscribe",
  "onCreateUnsubscribe",
  "onUnregisterAllTopics",
] as const;

type PluginEventFns = {
  publish: (topicId: TopicId, payload: unknown) => unknown;
  subscribe: (topicId: TopicId, payload: unknown) => unknown;
  onCreatePublish: (topicId: TopicId, payload: unknown) => void;
  onCreateSubscribe: (topicId: TopicId) => void;
  onCreateUnsubscribe: (topicId: TopicId) => void;
  onUnregisterAllTopics: () => void;
};

/**
 * Each plugin scope has its own PluginStore.
 */
export class PluginStore {
  private plugins: Plugin[] = [];
  private pluginsForEvent: Map<keyof Plugin, PluginEventFns[keyof Plugin][]> =
    new Map(pluginEventNames.map((name) => [name, []]));

  constructor() {}

  addPlugin(plugin: Plugin): void {
    this.plugins.push(plugin);
    pluginEventNames.forEach((eventName) => {
      if (plugin[eventName]) {
        this.pluginsForEvent.get(eventName)!.push(plugin[eventName]!);
      }
    });
  }

  size(eventName?: keyof Plugin): number {
    if (eventName) {
      return this.pluginsForEvent.get(eventName)!.length;
    }
    return this.plugins.length;
  }

  publishEvent(): PluginFn {
    return chainPlugins(
      this.pluginsForEvent.get("publish") as PluginEventFns["publish"][],
    );
  }

  subscribeEvent(): PluginFn {
    return chainPlugins(
      [
        ...(this.pluginsForEvent.get(
          "subscribe",
        ) as PluginEventFns["subscribe"][]),
      ].reverse(),
    );
  }

  onUnregisterAllTopicsEvent(): void {
    (this.pluginsForEvent.get(
      "onUnregisterAllTopics",
    ) as PluginEventFns["onUnregisterAllTopics"][])!.forEach((pluginEvent) => {
      pluginEvent();
    });
  }

  onCreatePublishEvent(topicId: string, payload: unknown): void {
    this.pluginsForEvent.get("onCreatePublish")!.forEach((pluginEvent) => {
      pluginEvent(topicId, payload);
    });
  }

  onCreateSubscribeEvent(topicId: string): void {
    (this.pluginsForEvent.get(
      "onCreateSubscribe",
    ) as PluginEventFns["onCreateSubscribe"][])!.forEach((pluginEvent) => {
      pluginEvent(topicId!);
    });
  }

  onCreateUnsubscribeEvent(topicId: string): void {
    (this.pluginsForEvent.get(
      "onCreateUnsubscribe",
    ) as PluginEventFns["onCreateUnsubscribe"][])!.forEach((pluginEvent) => {
      pluginEvent(topicId!);
    });
  }
}

type PluginFn = (topicId: TopicId, payload: unknown) => unknown;
export function chainPlugins(funcs: PluginFn[]): PluginFn {
  return (topicId: TopicId, initialValue: unknown): unknown => {
    return funcs.reduce((currentValue, currentFunction) => {
      return currentFunction(topicId, currentValue);
    }, initialValue);
  };
}
