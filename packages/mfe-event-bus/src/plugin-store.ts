import type { TopicId } from "./primitive-types";
import type { Subscription, SubscriptionStore } from "./subscription-store";

export type InitPlugIn = () => {
  onSubscribe?: (topicId: TopicId, subscription: Subscription) => void;
  onUnsubscribe?: (topicId: TopicId, subscription: Subscription) => void;
  onPublish?: (topicId: TopicId, subscription: Subscription) => void;
  onUnregisterAllTopics?: () => void;
};
export type PlugInStore = ReturnType<typeof initPluginStore>;

export function initPluginStore({
  subscriptionStore,
  plugins: _plugins,
}: {
  subscriptionStore: SubscriptionStore;
  plugins: Record<string, InitPlugIn>;
}) {
  type PlugIn = ReturnType<InitPlugIn>;
  const plugins: Map<string, PlugIn> = new Map(
    Object.entries(
      Object.entries(_plugins).reduce<Record<string, PlugIn>>(
        (acc, [name, init]) => {
          acc[name] = init();
          return acc;
        },
        {},
      ),
    ),
  );

  return {
    run: (eventName: keyof PlugIn, topicId?: TopicId): void => {
      plugins.forEach((plugin) => {
        eventName === "onUnregisterAllTopics"
          ? plugin[eventName]?.()
          : plugin[eventName]?.(topicId!, subscriptionStore.get(topicId!)!);
      });
    },
  };
}
