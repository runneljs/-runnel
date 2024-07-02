import {
  dispatchOnPublish,
  dispatchOnPublishCreated,
  dispatchOnSubscribe,
  dispatchOnSubscribeCreated,
} from "./dispatch-events";
import type { PayloadValidator } from "./payload-validator";
import type { JsonSchema, TopicId } from "./primitive-types";

export type TopicRegistration = <T>(
  topicId: TopicId,
  jsonSchema: JsonSchema,
  callback: () => T,
) => T;
export function createTopicRegistration(
  checkSchema: (topicId: TopicId, jsonSchema: JsonSchema) => void,
): TopicRegistration {
  return function TopicRegistration<T>(
    topicId: TopicId,
    jsonSchema: JsonSchema,
    callback: () => T,
  ) {
    checkSchema(topicId, jsonSchema);
    return callback();
  };
}

export type Sender = <T>(
  topicId: TopicId,
  jsonSchema: JsonSchema,
  _payload: T,
  callback: (payload: T) => void,
) => void;
export function buildSender(
  latestStateStore: Map<TopicId, unknown>,
  payloadValidator: PayloadValidator,
): Sender {
  return function sender<T>(
    topicId: TopicId,
    jsonSchema: JsonSchema,
    _payload: T,
    callback: (payload: T) => void,
  ): void {
    // Sender Preconditions
    const payload = payloadValidator(topicId, jsonSchema, _payload);
    dispatchOnPublish(topicId, payload);
    // Preserve the latest payload with the topicId.
    // So the newly registered topics can get the latest payload when they subscribe.
    latestStateStore.set(topicId, payload);
    dispatchOnPublishCreated(topicId);
    return callback(payload);
  };
}

export type Receiver = <T, U>(
  topicId: TopicId,
  subscriber: (payload: T) => void,
  callback: () => U,
) => U;
export function buildReceiver(
  latestStateStore: Map<TopicId, unknown>,
): Receiver {
  return function receiver<T, U>(
    topicId: TopicId,
    subscriber: (payload: T) => void,
    callback: () => U,
  ): U {
    if (latestStateStore.has(topicId)) {
      // As soon as a new subscriber subscribes, it should get the latest payload.
      dispatchOnSubscribe(topicId, latestStateStore.get(topicId));
      subscriber(latestStateStore.get(topicId) as T);
    }
    dispatchOnSubscribeCreated(topicId);
    return callback();
  };
}
