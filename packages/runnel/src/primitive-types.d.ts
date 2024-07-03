export type TopicId = string;
export type JsonSchema = object;
export type UUID = string;
export type Subscriber = (payload: any) => void;
export type Subscription = Map<UUID, Subscriber>;
