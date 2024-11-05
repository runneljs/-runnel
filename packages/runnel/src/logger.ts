import { getGlobal } from "./get-global";

export const enum LogEventNames {
  onCreateTopic = "log:runnel:onCreateTopic",
  onAddEventListener = "log:runnel:onAddEventListener",
  onPostMessage = "log:runnel:onPostMessage",
  onRemoveEventListener = "log:runnel:onRemoveEventListener",
}

export function createLogger<S>(topicId: keyof S) {
  // T as TopicId, P as Payload, S as Schemas
  type T = keyof S;
  type P = S[T];
  const dispatch = getGlobal().dispatchEvent;
  function onCreateTopic() {
    dispatch(
      new CustomEvent<{ topicId: T }>(LogEventNames.onCreateTopic, {
        detail: { topicId },
      }),
    );
  }
  function onAddEventListener() {
    dispatch(
      new CustomEvent<{ topicId: T }>(LogEventNames.onAddEventListener, {
        detail: { topicId },
      }),
    );
  }
  function onPostMessage(payload: P) {
    dispatch(
      new CustomEvent<{ topicId: T; payload: P }>(LogEventNames.onPostMessage, {
        detail: { topicId, payload },
      }),
    );
  }
  function onRemoveEventListener() {
    dispatch(
      new CustomEvent<{ topicId: T }>(LogEventNames.onRemoveEventListener, {
        detail: { topicId },
      }),
    );
  }
  return {
    onCreateTopic,
    onAddEventListener,
    onPostMessage,
    onRemoveEventListener,
  };
}
