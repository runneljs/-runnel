import type { TopicId } from "./topic-registration";

export type DispatchEventName =
  | "runnel:onpublish"
  | "runnel:onpublishcreated"
  | "runnel:onsubscribe"
  | "runnel:onsubscribecreated"
  | "runnel:onunsubscribe"
  | "runnel:onunregisteralltopics";

export function dispatchOnPublish(topicId: TopicId, payload: unknown) {
  dispatch("runnel:onpublish", { topicId, payload });
}

export function dispatchOnPublishCreated(topicId: TopicId) {
  dispatch("runnel:onpublishcreated", { topicId });
}

export function dispatchOnSubscribe(topicId: TopicId, payload: unknown) {
  dispatch("runnel:onsubscribe", { topicId, payload });
}

export function dispatchOnSubscribeCreated(topicId: TopicId) {
  dispatch("runnel:onsubscribecreated", { topicId });
}

export function dispatchOnUnsubscribe(topicId: TopicId) {
  dispatch("runnel:onunsubscribe", { topicId });
}

export function dispatchOnUnregisterAllTopics() {
  dispatch("runnel:onunregisteralltopics");
}

function dispatch(
  eventName: DispatchEventName,
  detail: Record<string, unknown> = {},
) {
  dispatchEvent(new CustomEvent(eventName, { detail }));
}
