import { getGlobal } from "./get-global";
import type { JsonSchema } from "./schema-manager";
import type { TopicId } from "./topic-name-to-id";

const globalVariable = getGlobal();

export const onCreateTopicEventName = "runnel:on-create-topic";
export type OnCreateTopicEventDetail = {
  topicId: TopicId;
  jsonSchema: JsonSchema;
};
export function dispatchOnCreateTopic(
  topicId: TopicId,
  jsonSchema: JsonSchema,
) {
  dispatch(onCreateTopicEventName, { topicId, jsonSchema });
}

export const onPostMessageEventName = "runnel:on-post-message";
export type OnPostMessageEventDetail = {
  topicId: TopicId;
  payload: unknown;
};
export function dispatchOnPostMessage(topicId: TopicId, payload: unknown) {
  dispatch(onPostMessageEventName, { topicId, payload });
}

export const onAddEventListenerEventName = "runnel:on-add-event-listener";
export type OnAddEventListenerEventDetail = {
  topicId: TopicId;
};
export function dispatchOnAddEventListener(topicId: TopicId) {
  dispatch(onAddEventListenerEventName, { topicId });
}

export const onRemoveEventListenerEventName = "runnel:on-remove-event-listener";
export type OnRemoveEventListenerEventDetail = {
  topicId: TopicId;
};
export function dispatchOnRemoveEventListener(topicId: TopicId) {
  dispatch(onRemoveEventListenerEventName, { topicId });
}

function dispatch(
  eventName: DispatchEventName,
  detail:
    | OnCreateTopicEventDetail
    | OnPostMessageEventDetail
    | OnAddEventListenerEventDetail
    | OnRemoveEventListenerEventDetail,
) {
  globalVariable.dispatchEvent(new CustomEvent(eventName, { detail }));
}

export type DispatchEventName =
  | typeof onPostMessageEventName
  | typeof onAddEventListenerEventName
  | typeof onRemoveEventListenerEventName
  | typeof onCreateTopicEventName;
