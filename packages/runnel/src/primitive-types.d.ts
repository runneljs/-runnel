export type TopicId = string;
export type JsonSchema = object;
export type UUID = string;
export type Subscriber = (payload: any) => void;
export type Subscription = Map<UUID, Subscriber>;
export type Plugin = {
  onCreateSubscribe?: (topicId: TopicId, schema: JsonSchema) => void;
  onCreateUnsubscribe?: (topicId: TopicId, schema: JsonSchema) => void;
  onCreatePublish?: (
    topicId: TopicId,
    schema: JsonSchema,
    payload: unknown,
  ) => void;
  onUnregisterAllTopics?: () => void;
  subscribe?: (topicId: TopicId, payload: unknown) => unknown;
  publish?: (topicId: TopicId, payload: unknown) => unknown;
};
export type PluginScope = any; // e.g., window, global, self, window.parent, window.top, etc.
