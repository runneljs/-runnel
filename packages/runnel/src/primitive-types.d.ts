export type TopicId = string;
export type JsonSchema = object;
export type UUID = string;
export type Subscriber = (payload: any) => void;
export type Subscription = Map<UUID, Subscriber>;
export type Plugin = {
  onCreateSubscribe?: (topicId: TopicId) => void;
  onCreateUnsubscribe?: (topicId: TopicId) => void;
  onCreatePublish?: (topicId: TopicId, payload: unknown) => void;
  onUnregisterAllTopics?: () => void;
  subscribe?: (topicId: TopicId, payload: unknown) => unknown;
  publish?: (topicId: TopicId, payload: unknown) => unknown;
};
export type PluginScope = any; // e.g., window, global, self, window.parent, window.top, etc.
