import { dispatchOnUnsubscribe } from "./dispatch-events";
import { createPayloadValidator, type Validator } from "./payload-validator";
import { createSchemaManager, type DeepEqual } from "./schema-manager";
import { SyncMap } from "./SyncMap";
import { topicNameToId, type TopicName } from "./topic-name-to-id";
import {
  buildReceiver,
  buildSender,
  createTopicRegistration,
  type JsonSchema,
  type TopicId,
} from "./topic-registration";

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
};

export function runnel(
  channelName: string,
  deepEqual: DeepEqual,
  validator: Validator,
): {
  close: () => void;
  registerTopic: RegisterTopic;
} {
  const schemaStoreMap = new SyncMap<TopicId, JsonSchema>(
    `${channelName}:runnel:schema`,
  );
  const latestStateStoreMap = new SyncMap<TopicId, unknown>(
    `${channelName}:runnel:latest-state`,
  );
  const schemaManager = createSchemaManager(deepEqual, schemaStoreMap);
  const topicRegistration = createTopicRegistration(schemaManager.checkSchema);
  const sender = buildSender(
    latestStateStoreMap,
    createPayloadValidator(validator),
  );
  const receiver = buildReceiver(latestStateStoreMap);

  const broadcastChannel = new BroadcastChannel(channelName);

  return {
    close: () => {
      broadcastChannel.close();
      // TODO: Perhaps better to invent a new event?
      // dispatchOnUnregisterAllTopics();
    },
    registerTopic: <T>(
      topicName: TopicName,
      jsonSchema: JsonSchema,
      options?: { version?: number },
    ) => {
      const { version } = options ?? {};
      const topicId = topicNameToId(topicName, version);
      return topicRegistration(topicId, jsonSchema, () => {
        return {
          subscribe: (callback: (payload: T) => void) => {
            return receiver(topicId, callback, () => {
              const eventListener = (event: MessageEvent) => {
                if (event.data.topicId === topicId) {
                  callback(event.data.payload);
                }
              };
              broadcastChannel.addEventListener("message", eventListener);
              return function unsubscribe() {
                broadcastChannel.removeEventListener("message", eventListener);
                dispatchOnUnsubscribe(topicId);
              };
            });
          },
          publish: (_payload: T) => {
            sender(topicId, jsonSchema, _payload, (payload: T) => {
              broadcastChannel.postMessage({
                topicId,
                payload,
              });
            });
          },
        };
      });
    },
  };
}
