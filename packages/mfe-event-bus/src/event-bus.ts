import { PayloadMismatchError, TopicNotFoundError } from "./errors";
import type { RunPlugins } from "./legacy-run-plugins";
import type { JsonSchema, UUID } from "./primitive-types";
import type { SubscriptionStore } from "./SubscriptionStore";

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
  chainForEvent,
  payloadValidator,
}: {
  latestStateStore: Map<string, unknown>;
  subscriptionStore: SubscriptionStore;
  checkSchema: (topicId: string, incomingSchema: JsonSchema) => void;
  runPlugins: RunPlugins;
  chainForEvent: (
    eventName: "publish" | "subscribe",
  ) => (topicId: string, payload: unknown) => unknown;
  payloadValidator: Validator;
}) {
  return {
    registerTopic: createRegisterTopic(
      latestStateStore,
      subscriptionStore,
      checkSchema,
      runPlugins,
      chainForEvent,
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
  chainForEvent: (
    eventName: "publish" | "subscribe",
  ) => (topicId: string, payload: unknown) => unknown,
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
          // callback(payload);
          callback(
            chainForEvent("subscribe")(
              topicId,
              chainForEvent("publish")(topicId, payload),
            ) as T,
          );
        });
    };

    const subscribe = (callback: (payload: T) => void) => {
      if (latestStateStore.has(topicId)) {
        // As soon as a new subscriber subscribes, it should get the latest payload.
        // callback(latestStateStore.get(topicId)! as T);
        callback(
          chainForEvent("subscribe")(
            topicId,
            chainForEvent("publish")(topicId, latestStateStore.get(topicId)!),
          ) as T,
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
        runPlugins("onSubscribe", topicId);

        return () => {
          unsubscribe();
          runPlugins("onUnsubscribe", topicId);
        };
      },
      publish: (payload: T) => {
        publish(payload);
        runPlugins("onPublish", topicId, payload);
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
    runPlugins("onUnregisterAllTopics");
    latestStateStore.clear();
    subscriptionStore.clear();
  };
}

function topicNameToId(topicName: TopicName, version?: number) {
  return `${topicName}${version !== undefined && version > 0 ? `@${version}` : ""}`;
}
