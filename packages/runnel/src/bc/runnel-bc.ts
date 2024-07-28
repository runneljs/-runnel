import { dispatchOnUnsubscribe } from "../dispatch-events";
import {
  createSchemaManager,
  type DeepEqual,
} from "../feat-schema/schema-manager";
import { getGlobal, type GlobalType, type RunnelGlobals } from "../get-global";
import { createPayloadValidator, type Validator } from "../payload-validator";
import { topicNameToId, type TopicName } from "../topic-name-to-id";
import {
  buildReceiver,
  buildSender,
  createTopicRegistration,
  type JsonSchema,
  type TopicId,
} from "../topic-registration";

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

export type RunnelBC = {
  close: () => void;
  registerTopic: RegisterTopic;
};

export function runnelBC(
  channelName: string,
  deepEqual: DeepEqual,
  validator: Validator,
  globalVar: GlobalType = getGlobal(),
): {
  close: () => void;
  registerTopic: RegisterTopic;
} {
  // TODO: Maybe use sessionStorage?
  const _runnel = (globalVar.__runnel ??= {} as RunnelGlobals);
  _runnel.schemaStoreMap ??= new Map<TopicId, JsonSchema>();
  _runnel.latestStateStoreMap ??= new Map<TopicId, unknown>();

  const latestStateStore = _runnel.latestStateStoreMap;
  const schemaManager = createSchemaManager(deepEqual, _runnel.schemaStoreMap);
  const topicRegistration = createTopicRegistration(schemaManager.checkSchema);
  const sender = buildSender(
    latestStateStore,
    createPayloadValidator(validator),
  );
  const receiver = buildReceiver(latestStateStore);

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
