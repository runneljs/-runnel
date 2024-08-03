import type { TopicId } from "./topic-registration";

export type DispatchEventName =
  | "runnel:onpublish"
  | "runnel:onpublishcreated"
  | "runnel:onsubscribe"
  | "runnel:onsubscribecreated"
  | "runnel:onunsubscribe"
  | "runnel:onunregisteralltopics";

export const onPublishEventName = "runnel:onpublish";
export type OnPublishEventPayload = {
  topicId: TopicId;
  payload: unknown;
};
export function dispatchOnPublish(topicId: TopicId, payload: unknown) {
  dispatch(onPublishEventName, { topicId, payload });
}

export const onPublishCreatedEventName = "runnel:onpublishcreated";
export type OnPublishCreatedEventPayload = {
  topicId: TopicId;
};
export function dispatchOnPublishCreated(topicId: TopicId) {
  dispatch(onPublishCreatedEventName, { topicId });
}

export const onSubscribeEventName = "runnel:onsubscribe";
export type OnSubscribeEventPayload = {
  topicId: TopicId;
  payload: unknown;
};
export function dispatchOnSubscribe(topicId: TopicId, payload: unknown) {
  dispatch(onSubscribeEventName, { topicId, payload });
}

export const onSubscribeCreatedEventName = "runnel:onsubscribecreated";
export type OnSubscribeCreatedEventPayload = {
  topicId: TopicId;
};
export function dispatchOnSubscribeCreated(topicId: TopicId) {
  dispatch(onSubscribeCreatedEventName, { topicId });
}

export const onUnsubscribeEventName = "runnel:onunsubscribe";
export type OnUnsubscribeEventPayload = {
  topicId: TopicId;
};
export function dispatchOnUnsubscribe(topicId: TopicId) {
  dispatch(onUnsubscribeEventName, { topicId });
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
