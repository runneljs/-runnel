export type TopicId = string;
export type JsonSchema = object;
export type UUID = string;
export type Scope = any; // r.g., window, global, self, window.parent, window.top, etc.
export type Subscriber = (payload: any) => void;
export type Subscription = Map<UUID, Subscriber>;
export type Plugin = {
  onSubscribe?: (topicId: TopicId, subscription: Subscription) => void;
  onUnsubscribe?: (topicId: TopicId, subscription: Subscription) => void;
  onPublish?: (
    topicId: TopicId,
    subscription: Subscription,
    payload: unknown,
  ) => void;
  onUnregisterAllTopics?: () => void;
  subscribe?: (topicId: TopicId, payload: unknown) => unknown;
  publish?: (topicId: TopicId, payload: unknown) => unknown;
};
export type PluginScope = any; // r.g., window, global, self, window.parent, window.top, etc.
