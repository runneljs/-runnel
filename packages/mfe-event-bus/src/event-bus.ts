import {
  PayloadMismatchError,
  SchemaMismatchError,
  TopicNotFoundError,
} from "./errors";
import type { RunPlugIns } from "./plugin-store";
import type { JsonSchema, UUID } from "./primitive-types";
import type { SubscriptionStore } from "./subscription-store";

export type DeepEqual = (value: JsonSchema, other: JsonSchema) => boolean;
export type Validator = (
  jsonSchema: JsonSchema,
) => (payload: unknown) => boolean;

type TopicName = string;
export function eventBus({
  latestStateStore,
  subscriptionStore,
  runPlugIns,
  deepEqual,
  payloadValidator,
}: {
  latestStateStore: Map<string, unknown>;
  subscriptionStore: SubscriptionStore;
  runPlugIns: RunPlugIns;
  deepEqual: DeepEqual;
  payloadValidator: Validator;
}) {
  return {
    registerTopic: createRegisterTopic(
      latestStateStore,
      subscriptionStore,
      runPlugIns,
      deepEqual,
      payloadValidator,
    ),
    unregisterTopic: createUnregisterTopic(latestStateStore, subscriptionStore),
    unregisterAllTopics: createUnregisterAllTopics(
      latestStateStore,
      subscriptionStore,
      runPlugIns,
    ),
  };
}

function createRegisterTopic(
  latestStateStore: Map<string, unknown>,
  subscriptionStore: SubscriptionStore,
  runPlugIns: RunPlugIns,
  deepEqual: DeepEqual,
  payloadValidator: Validator,
) {
  return function registerTopic<T>(
    topicName: TopicName,
    jsonSchema: JsonSchema,
    options?: { version?: number },
  ) {
    const { version } = options ?? {};
    const topicId = topicNameToId(topicName, version);

    if (subscriptionStore.has(topicId)) {
      const { schema } = subscriptionStore.get(topicId)!;
      if (!deepEqual(jsonSchema, schema)) {
        throw new SchemaMismatchError(topicId, schema, jsonSchema);
      }
    } else {
      const { schema, subscribers } = subscriptionStore.get(topicId) || {
        schema: jsonSchema,
        subscribers: new Map<UUID, <T>(payload: T) => void>(),
      };
      subscriptionStore.set(topicId, { schema, subscribers });
    }

    const subscribe = (callback: (payload: T) => void) => {
      if (latestStateStore.has(topicId)) {
        // As soon as a new subscriber subscribes, it should get the latest payload.
        callback(latestStateStore.get(topicId)! as T);
      }
      const uuid = crypto.randomUUID();
      subscriptionStore.update(topicId, uuid, callback);
      return function unsubscribe() {
        subscriptionStore.update(topicId, uuid);
      };
    };

    const publish = (payload: T) => {
      if (!payloadValidator(jsonSchema)(payload)) {
        throw new PayloadMismatchError(topicId, jsonSchema, payload);
      }
      // Preserve the latest payload with the topicId. So the newly registered topics can get the latest payload when they subscribe.
      latestStateStore.set(topicId, payload);
      subscriptionStore
        .get(topicId)
        ?.subscribers.forEach((callback: (payload: T) => void) => {
          callback(payload);
        });
    };

    return {
      subscribe: (callback: (payload: T) => void) => {
        const unsubscribe = subscribe(callback);
        runPlugIns("onSubscribe", topicId);

        return () => {
          unsubscribe();
          runPlugIns("onUnsubscribe", topicId);
        };
      },
      publish: (payload: T) => {
        publish(payload);
        runPlugIns("onPublish", topicId, payload);
      },
    };
  };
}

function createUnregisterTopic(
  latestStateStore: Map<string, unknown>,
  subscriptionStore: SubscriptionStore,
) {
  return function unregisterTopic(
    topicName: TopicName,
    options?: { version?: number },
  ) {
    const { version } = options ?? {};
    const topicId = topicNameToId(topicName, version);
    if (subscriptionStore.has(topicId)) {
      subscriptionStore.delete(topicId);
      latestStateStore.delete(topicId);
    } else {
      throw new TopicNotFoundError(topicId);
    }
  };
}

function createUnregisterAllTopics(
  latestStateStore: Map<string, unknown>,
  subscriptionStore: SubscriptionStore,
  runPlugIns: RunPlugIns,
) {
  return function unregisterAllTopics() {
    runPlugIns("onUnregisterAllTopics");
    latestStateStore.clear();
    subscriptionStore.clear();
  };
}

function topicNameToId(topicName: TopicName, version?: number) {
  return `${topicName}${version !== undefined && version > 0 ? `@${version}` : ""}`;
}
