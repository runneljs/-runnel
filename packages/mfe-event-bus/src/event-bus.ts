import {
  PayloadMismatchError,
  SchemaMismatchError,
  TopicNotFoundError,
} from "./errors";
import type { PlugIn } from "./plugin-store";
import type { JsonSchema, UUID } from "./primitive-types";
import type { SubscriptionStore } from "./subscription-store";

export type DeepEqual = (value: JsonSchema, other: JsonSchema) => boolean;
export type Validator = (
  jsonSchema: JsonSchema,
) => (payload: unknown) => boolean;

type TopicName = string;

export function eventBus({
  deepEqual,
  payloadValidator,
  subscriptionStore,
  runPlugins,
}: {
  deepEqual: DeepEqual;
  payloadValidator: Validator;
  subscriptionStore: SubscriptionStore;
  runPlugins: (eventName: keyof PlugIn, topicId?: string) => void;
}) {
  function registerTopic<T>(
    topicName: TopicName,
    jsonSchema: JsonSchema,
    options?: { version?: number },
  ) {
    const { version } = options ?? {};
    const topicId = topicNameToId(topicName, version);
    const { schema, subscribers } = subscriptionStore.get(topicId) || {
      schema: jsonSchema,
      subscribers: new Map<UUID, <T>(payload: T) => void>(),
    };
    if (!deepEqual(jsonSchema, schema)) {
      throw new SchemaMismatchError(topicId, schema, jsonSchema);
    }
    subscriptionStore.set(topicId, { schema, subscribers });

    const subscribe = (callback: (payload: T) => void) => {
      const uuid = crypto.randomUUID();
      subscriptionStore.update(topicId, uuid, callback);
      return function unsubscribe() {
        subscriptionStore.update(topicId, uuid);
      };
    };

    const publish = (payload: T) => {
      if (!payloadValidator(schema)(payload)) {
        throw new PayloadMismatchError(topicId, schema, payload);
      }
      subscriptionStore
        .get(topicId)
        ?.subscribers.forEach((callback: (payload: T) => void) => {
          callback(payload);
        });
    };

    return {
      subscribe: (callback: (payload: T) => void) => {
        const unsubscribe = subscribe(callback);
        runPlugins("onSubscribe", topicId);

        return () => {
          unsubscribe();
          runPlugins("onUnsubscribe", topicId);
        };
      },
      publish: (payload: T) => {
        publish(payload);
        runPlugins("onPublish", topicId);
      },
    };
  }

  function unregisterTopic(
    topicName: TopicName,
    options?: { version?: number },
  ) {
    const { version } = options ?? {};
    const topicId = topicNameToId(topicName, version);
    if (subscriptionStore.has(topicId)) {
      subscriptionStore.delete(topicId);
    } else {
      throw new TopicNotFoundError(topicId);
    }
  }

  function unregisterAllTopics() {
    runPlugins("onUnregisterAllTopics");
    subscriptionStore.clear();
  }

  return { registerTopic, unregisterTopic, unregisterAllTopics };
}

function topicNameToId(topicName: TopicName, version?: number) {
  return `${topicName}${version !== undefined && version > 0 ? `@${version}` : ""}`;
}
