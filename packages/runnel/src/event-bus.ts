import type { SubscriptionStore } from "./SubscriptionStore";
import { PayloadMismatchError, TopicNotFoundError } from "./errors";
import type { PluginEmitter } from "./feat-plugin/plugin-emitter";
import type { SchemaManager } from "./feat-schema/schema-manager";
import type { JsonSchema, TopicId, UUID } from "./primitive-types";

type TopicName = string;

export type Validator = (
  jsonSchema: JsonSchema,
) => (payload: unknown) => boolean;

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
  unregisterTopic: (
    topicName: TopicName,
    options?: {
      version?: number;
    },
  ) => void;
  unregisterAllTopics: () => void;
  getTopics: SchemaManager["getTopics"];
  getSchemaByTopicId: SchemaManager["getSchemaByTopicId"];
};

export function eventBus({
  latestStateStore,
  subscriptionStore,
  schemaManager,
  pluginEmitter,
  payloadValidator,
}: {
  latestStateStore: Map<TopicId, unknown>;
  subscriptionStore: SubscriptionStore;
  schemaManager: SchemaManager;
  pluginEmitter: PluginEmitter;
  payloadValidator: Validator;
}): EventBus {
  return {
    registerTopic: createRegisterTopic(
      latestStateStore,
      subscriptionStore,
      schemaManager.checkSchema,
      pluginEmitter,
      payloadValidator,
    ),
    unregisterTopic: createUnregisterTopic(latestStateStore, subscriptionStore),
    unregisterAllTopics: createUnregisterAllTopics(
      latestStateStore,
      subscriptionStore,
      pluginEmitter,
    ),
    getTopics: schemaManager.getTopics,
    getSchemaByTopicId: schemaManager.getSchemaByTopicId,
  };
}

function createRegisterTopic(
  latestStateStore: Map<string, unknown>,
  subscriptionStore: SubscriptionStore,
  checkSchema: (topicId: string, incomingSchema: JsonSchema) => void,
  pluginEmitter: PluginEmitter,
  payloadValidator: Validator,
): RegisterTopic {
  return function registerTopic<T>(
    topicName: TopicName,
    jsonSchema: JsonSchema,
    options?: { version?: number },
  ) {
    const { version } = options ?? {};
    const topicId = topicNameToId(topicName, version);

    checkSchema(topicId, jsonSchema);

    const subscribers =
      subscriptionStore.get(topicId) ||
      new Map<UUID, <T>(payload: T) => void>();
    subscriptionStore.set(topicId, subscribers);

    const publish = (_payload: T) => {
      if (!payloadValidator(jsonSchema)(_payload)) {
        throw new PayloadMismatchError(topicId, jsonSchema, _payload);
      }
      const payload = pluginEmitter.publish(topicId, _payload);
      // Preserve the latest payload with the topicId. So the newly registered topics can get the latest payload when they subscribe.
      latestStateStore.set(topicId, payload);
      subscriptionStore
        .get(topicId)
        ?.forEach((callback: (payload: T) => void) => {
          callback(pluginEmitter.subscribe(topicId, payload) as T);
        });
    };

    const subscribe = (callback: (payload: T) => void) => {
      if (latestStateStore.has(topicId)) {
        // As soon as a new subscriber subscribes, it should get the latest payload.
        callback(
          pluginEmitter.subscribe(topicId, latestStateStore.get(topicId)!) as T,
        );
      }
      const uuid = crypto.randomUUID();
      subscriptionStore.update(topicId, uuid, callback);
      return function unsubscribe() {
        subscriptionStore.update(topicId, uuid);
      };
    };

    return {
      subscribe: (callback: (payload: T) => void) => {
        const unsubscribe = subscribe(callback);
        pluginEmitter.onCreateSubscribe(topicId);

        return () => {
          unsubscribe();
          pluginEmitter.onCreateUnsubscribe(topicId);
        };
      },
      publish: (payload: T) => {
        publish(payload);
        pluginEmitter.onCreatePublish(topicId, payload);
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
  pluginEmitter: PluginEmitter,
) {
  return function unregisterAllTopics() {
    if (subscriptionStore.size !== 0) {
      subscriptionStore.clear();
      latestStateStore.clear();
      pluginEmitter.onUnregisterAllTopics();
    }
  };
}

function topicNameToId(topicName: TopicName, version?: number) {
  return `${topicName}${version !== undefined && version > 0 ? `@${version}` : ""}`;
}
