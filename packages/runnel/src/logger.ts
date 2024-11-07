/**
 * This file is used to create a logger for the runnel.
 * It can be used to observe the log events.
 * @module
 */

import { getGlobal } from "./get-global";

export const enum LogEventNames {
  onCreateTopic = "log:runnel:onCreateTopic",
  onAddEventListener = "log:runnel:onAddEventListener",
  onPostMessage = "log:runnel:onPostMessage",
  onRemoveEventListener = "log:runnel:onRemoveEventListener",
}

export function createLogger<S>(topicId: keyof S) {
  // T as TopicId, S as Schemas
  type T = keyof S;
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
  function onPostMessage() {
    dispatch(
      new CustomEvent<{ topicId: T }>(LogEventNames.onPostMessage, {
        detail: { topicId },
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
