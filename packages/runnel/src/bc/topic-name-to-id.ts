import type { TopicId } from "./topic-registration";

export type TopicName = string;

export function topicNameToId(topicName: TopicName, version?: number): TopicId {
  return `${topicName}${version !== undefined && version > 0 ? `@${version}` : ""}`;
}
