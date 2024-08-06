import {
  dispatchOnAddEventListener,
  dispatchOnCreateTopic,
  dispatchOnPostMessage,
  dispatchOnRemoveEventListener,
} from "./dispatch-events";
import { DualBroadcastChannel } from "./DualBroadcastChannel";
import { getGlobal } from "./get-global";
import { createPayloadValidator, type Validator } from "./payload-validator";
import {
  createSchemaManager,
  type DeepEqual,
  type JsonSchema,
  type SchemaManager,
} from "./schema-manager";
import { SyncMap } from "./SyncMap";
import {
  topicNameToId,
  type TopicId,
  type TopicName,
} from "./topic-name-to-id";

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

export type Runnel = {
  close: () => void;
  registerTopic: RegisterTopic;
  getTopics: SchemaManager["getTopics"];
  getSchemaByTopicId: SchemaManager["getSchemaByTopicId"];
};

export function runnel(
  channelName: string,
  deepEqual: DeepEqual,
  validator: Validator,
): Runnel {
  const channel = new DualBroadcastChannel(channelName);
  const globalVariable = getGlobal();
  globalVariable.__runnel ??= {};
  globalVariable.__runnel.schemaStoreMap ??= new SyncMap<TopicId, JsonSchema>(
    `runnel:schema:${channelName}`,
  );
  globalVariable.__runnel.latestStateStoreMap ??= new SyncMap<TopicId, unknown>(
    `runnel:latest-state:${channelName}`,
  );
  const schemaManager = createSchemaManager(
    deepEqual,
    globalVariable.__runnel.schemaStoreMap,
  );
  const payloadValidator = createPayloadValidator(validator);

  return {
    close: () => {
      channel.close();
    },
    registerTopic: <T>(
      topicName: TopicName,
      jsonSchema: JsonSchema,
      options?: { version?: number },
    ) => {
      const { version } = options ?? {};
      const topicId = topicNameToId(topicName, version);

      // 1. Register Topic
      schemaManager.checkSchema(topicId, jsonSchema);
      dispatchOnCreateTopic(topicId, jsonSchema);

      return {
        subscribe: (subscriber: (payload: T) => void) => {
          const eventListener = (messageEvent: MessageEvent) => {
            if (messageEvent.data.topicId === topicId) {
              subscriber(messageEvent.data.payload);
            }
          };
          channel.addEventListener("message", eventListener);
          dispatchOnAddEventListener(topicId);

          if (globalVariable.__runnel.latestStateStoreMap!.has(topicId)) {
            // As soon as a new subscriber is added, the subscriber should receive the latest payload.
            subscriber(
              globalVariable.__runnel.latestStateStoreMap!.get(topicId) as T,
            );
            dispatchOnPostMessage(
              topicId,
              globalVariable.__runnel.latestStateStoreMap!.get(topicId),
            );
          }

          return function unsubscribe() {
            channel.removeEventListener("message", eventListener);
            dispatchOnRemoveEventListener(topicId);
          };
        },
        publish: (_payload: T) => {
          const payload = payloadValidator(topicId, jsonSchema, _payload);
          channel.postMessage({
            topicId,
            payload,
          });
          dispatchOnPostMessage(topicId, payload);
          // Preserve the latest payload with the topicId.
          // So the newly registered topics can get the latest payload when they subscribe.
          globalVariable.__runnel.latestStateStoreMap!.set(topicId, payload);
        },
      };
    },
    getTopics: schemaManager.getTopics,
    getSchemaByTopicId: schemaManager.getSchemaByTopicId,
  };
}
