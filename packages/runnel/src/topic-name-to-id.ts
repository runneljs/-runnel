import type { TopicId } from "./primitive-types";
export type TopicName = string;

export function topicNameToId(topicName: TopicName, version?: number): TopicId {
  return `${topicName}${version !== undefined && version > 0 ? `@${version}` : ""}`;
}
