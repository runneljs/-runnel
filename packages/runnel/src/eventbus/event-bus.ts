import { dispatchOnSubscribe, dispatchOnUnsubscribe } from "../dispatch-events";
import type { SchemaManager } from "../feat-schema/schema-manager";
import { topicNameToId, type TopicName } from "../topic-name-to-id";
import {
  createTopicRegistration,
  type JsonSchema,
  type Receiver,
  type Sender,
  type TopicId,
  type TopicRegistration,
} from "../topic-registration";
import type { SubscriptionStore } from "./SubscriptionStore";
import {
  createUnregisterAllTopics,
  type UnregisterAllTopics,
} from "./unregister-all";
import {
  createUnregisterTopic,
  type UnregisterTopic,
} from "./unregister-topic";

type Unsubscribe = () => void;
export type RegisterTopic = <T>(
  topicName: TopicName,
  jsonSchema: JsonSchema,
  options?: {
    version?: number;
  },
) => {
  subscribe: (callback: (payload: T) => void) => Unsubscribe;
  publish: (payload: T) => void;
};

export type EventBus = {
  registerTopic: RegisterTopic;
  unregisterTopic: UnregisterTopic;
  unregisterAllTopics: UnregisterAllTopics;
  getTopics: SchemaManager["getTopics"];
  getSchemaByTopicId: SchemaManager["getSchemaByTopicId"];
};

/**
 * Pub/Sub
 */
export function eventBus({
  latestStateStore,
  subscriptionStore,
  schemaManager,
  sender,
  receiver,
}: {
  latestStateStore: Map<TopicId, unknown>;
  subscriptionStore: SubscriptionStore;
  schemaManager: SchemaManager;
  sender: Sender;
  receiver: Receiver;
}): EventBus {
  return {
    registerTopic: createRegisterTopic(
      createTopicRegistration(schemaManager.checkSchema),
      createPublish(sender),
      createSubscribe(receiver),
      subscriptionStore,
    ),
    unregisterTopic: createUnregisterTopic(latestStateStore, subscriptionStore),
    unregisterAllTopics: createUnregisterAllTopics(
      latestStateStore,
      subscriptionStore,
    ),
    getTopics: schemaManager.getTopics,
    getSchemaByTopicId: schemaManager.getSchemaByTopicId,
  };
}

function createRegisterTopic(
  topicRegistration: TopicRegistration,
  initPublish: InitPublish,
  initSubscribe: InitSubscribe,
  subscriptionStore: SubscriptionStore,
): RegisterTopic {
  return function registerTopic<T>(
    topicName: TopicName,
    jsonSchema: JsonSchema,
    options?: { version?: number },
  ) {
    const { version } = options ?? {};
    const topicId = topicNameToId(topicName, version);
    return topicRegistration(topicId, jsonSchema, () => {
      const subscribers = subscriptionStore.getOrCreate(topicId);
      subscriptionStore.set(topicId, subscribers);

      return {
        subscribe: initSubscribe(subscriptionStore, topicId),
        publish: initPublish(subscriptionStore, topicId, jsonSchema),
      };
    });
  };
}

type InitPublish = <T>(
  subscriptionStore: SubscriptionStore,
  topicId: TopicId,
  jsonSchema: JsonSchema,
) => (payload: T) => void;
function createPublish(sender: Sender): InitPublish {
  return function initPublish<T>(
    subscriptionStore: SubscriptionStore,
    topicId: TopicId,
    jsonSchema: JsonSchema,
  ): (payload: T) => void {
    return function publish<T>(_payload: T) {
      sender(topicId, jsonSchema, _payload, (payload: T) => {
        subscriptionStore
          .get(topicId)
          ?.forEach((callback: (payload: T) => void) => {
            callback(payload);
            dispatchOnSubscribe(topicId, payload);
          });
      });
    };
  };
}

type InitSubscribe = <T>(
  subscriptionStore: SubscriptionStore,
  topicId: TopicId,
) => (callback: (payload: T) => void) => Unsubscribe;
function createSubscribe(receiver: Receiver): InitSubscribe {
  return function initSubscribe<T>(
    subscriptionStore: SubscriptionStore,
    topicId: TopicId,
  ) {
    return function subscribe(callback: (payload: T) => void) {
      const _subscribe = (subscriber: (payload: T) => void) => {
        return receiver(topicId, subscriber, () => {
          const uuid = crypto.randomUUID();
          subscriptionStore.update(topicId, uuid, subscriber);

          return function unsubscribe(): void {
            subscriptionStore.update(topicId, uuid);
          };
        });
      };

      const unsubscribe = _subscribe(callback);
      return () => {
        unsubscribe();
        dispatchOnUnsubscribe(topicId);
      };
    };
  };
}
