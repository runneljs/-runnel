import type { SubscriptionStore } from "./SubscriptionStore";
import { PayloadMismatchError, TopicNotFoundError } from "./errors";
import type { JsonSchema, TopicId, UUID } from "./primitive-types";
import type { RunPlugins } from "./run-plugins";

export type Validator = (
  jsonSchema: JsonSchema,
) => (payload: unknown) => boolean;

type TopicName = string;
export type EventBus = ReturnType<typeof eventBus>;
export function eventBus({
  latestStateStore,
  subscriptionStore,
  checkSchema,
  runPlugins,
  pluginEventChain,
  payloadValidator,
}: {
  latestStateStore: Map<TopicId, unknown>;
  subscriptionStore: SubscriptionStore;
  checkSchema: (topicId: TopicId, incomingSchema: JsonSchema) => void;
  runPlugins: RunPlugins;
  pluginEventChain: (topicId: TopicId, payload: unknown) => unknown;
  payloadValidator: Validator;
}) {
  return {
    registerTopic: createRegisterTopic(
      latestStateStore,
      subscriptionStore,
      checkSchema,
      runPlugins,
      pluginEventChain,
      payloadValidator,
    ),
    unregisterTopic: createUnregisterTopic(latestStateStore, subscriptionStore),
    unregisterAllTopics: createUnregisterAllTopics(
      latestStateStore,
      subscriptionStore,
      runPlugins,
    ),
  };
}

function createRegisterTopic(
  latestStateStore: Map<string, unknown>,
  subscriptionStore: SubscriptionStore,
  checkSchema: (topicId: string, incomingSchema: JsonSchema) => void,
  runPlugins: RunPlugins,
  pluginEventChain: (topicId: string, payload: unknown) => unknown,
  payloadValidator: Validator,
) {
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

    const publish = (payload: T) => {
      if (!payloadValidator(jsonSchema)(payload)) {
        throw new PayloadMismatchError(topicId, jsonSchema, payload);
      }
      // Preserve the latest payload with the topicId. So the newly registered topics can get the latest payload when they subscribe.
      latestStateStore.set(topicId, payload);
      subscriptionStore
        .get(topicId)
        ?.forEach((callback: (payload: T) => void) => {
          callback(pluginEventChain(topicId, payload) as T);
        });
    };

    const subscribe = (callback: (payload: T) => void) => {
      if (latestStateStore.has(topicId)) {
        // As soon as a new subscriber subscribes, it should get the latest payload.
        callback(
          pluginEventChain(topicId, latestStateStore.get(topicId)!) as T,
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
        runPlugins("onCreateSubscribe", topicId);

        return () => {
          unsubscribe();
          runPlugins("onCreateUnsubscribe", topicId);
        };
      },
      publish: (payload: T) => {
        publish(payload);
        runPlugins("onCreatePublish", topicId, payload);
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
  runPlugins: RunPlugins,
) {
  return function unregisterAllTopics() {
    if (subscriptionStore.size !== 0) {
      subscriptionStore.clear();
      latestStateStore.clear();
      runPlugins("onUnregisterAllTopics");
    }
  };
}

function topicNameToId(topicName: TopicName, version?: number) {
  return `${topicName}${version !== undefined && version > 0 ? `@${version}` : ""}`;
}
