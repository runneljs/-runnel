import { PayloadMismatchError, SchemaMismatchError } from "./errors";
import type { PlugInStore } from "./plugin-store";
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
  pluginStore,
}: {
  deepEqual: DeepEqual;
  payloadValidator: Validator;
  subscriptionStore: SubscriptionStore;
  pluginStore?: PlugInStore;
}) {
  function registerTopic<T>(
    topicName: TopicName,
    jsonSchema: JsonSchema,
    options?: { version?: string },
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
        pluginStore?.run("onSubscribe", topicId);
        return () => {
          unsubscribe();
          pluginStore?.run("onUnsubscribe", topicId);
        };
      },
      publish: (payload: T) => {
        publish(payload);
        pluginStore?.run("onPublish", topicId);
      },
    };
  }

  function unregisterTopic(topicName: TopicName, options?: { version?: "1" }) {
    const { version } = options ?? {};
    subscriptionStore.delete(topicNameToId(topicName, version));
  }

  function unregisterAllTopics() {
    pluginStore?.run("onUnregisterAllTopics");
    subscriptionStore.clear();
  }

  return { registerTopic, unregisterTopic, unregisterAllTopics };
}

function topicNameToId(topicName: TopicName, version?: string) {
  return `${topicName}${typeof version === "string" && version.length > 0 ? `@${version}` : ""}`;
}
