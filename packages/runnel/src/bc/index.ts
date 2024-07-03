import {
  dispatchOnSubscribe,
  dispatchOnUnregisterAllTopics,
} from "../dispatch-events";
import {
  createSchemaManager,
  type DeepEqual,
  type SchemaManager,
} from "../feat-schema/schema-manager";
import { getGlobal } from "../get-global";
import { createPayloadValidator, type Validator } from "../payload-validator";
import type { JsonSchema, TopicId } from "../primitive-types";
import type { GlobalType, RunnelGlobals } from "../scope";
import { topicNameToId } from "../topic-name-to-id";
import { buildReceiver, buildSender } from "../topic-registration";

const defaultKeys = {
  topicNameKey: "topic",
  versionKey: "version",
  schemaKey: "schema",
  payloadKey: "payload",
};

export type RunnelBroadcastChannel = (
  bc: BroadcastChannel,
  deepEqual: DeepEqual,
  validator: Validator,
  keys: {
    topicNameKey: string;
    versionKey: string;
    schemaKey: string;
    payloadKey: string;
  },
  globalVar: GlobalType,
) => {
  postMessage: (
    message: any,
    topicName?: string,
    schema?: JsonSchema,
    version?: number,
  ) => void;
  onmessage: (
    event: MessageEvent,
    topicName?: string,
    schema?: JsonSchema,
    version?: number,
  ) => void;
  onmessageerror: (event: MessageEvent) => void;
  addEventListener: (
    eventType: "message",
    listener: (event: MessageEvent) => void,
    topicName?: string,
    schema?: JsonSchema,
    version?: number,
  ) => void;
  close: () => void;
  name: string;
  getTopics: SchemaManager["getTopics"];
  getSchemaByTopicId: SchemaManager["getSchemaByTopicId"];
};

export function runnel(
  bc: BroadcastChannel,
  deepEqual: DeepEqual,
  validator: Validator,
  keys: {
    topicNameKey: string;
    versionKey: string;
    schemaKey: string;
    payloadKey: string;
  } = defaultKeys,
  globalVar: GlobalType = getGlobal(),
): ReturnType<RunnelBroadcastChannel> {
  const _runnel = (globalVar.__runnel ??= {} as RunnelGlobals);
  _runnel.schemaStoreMap ??= new Map<TopicId, JsonSchema>();
  _runnel.latestStateStoreMap ??= new Map<TopicId, unknown>();

  const latestStateStore = _runnel.latestStateStoreMap;
  const schemaManager = createSchemaManager(deepEqual, _runnel.schemaStoreMap);
  const sender = buildSender(
    latestStateStore,
    createPayloadValidator(validator),
  );
  const receiver = buildReceiver(latestStateStore);
  const _keys = { ...defaultKeys, ...keys };

  return {
    postMessage: (
      message: any,
      topicName?: string,
      schema?: JsonSchema,
      version?: number,
    ): void => {
      createSendMessage(() => bc.postMessage(message))(
        message,
        topicName,
        schema,
        version,
      );
    },
    onmessage: (
      event: MessageEvent,
      topicName?: string,
      schema?: JsonSchema,
      version?: number,
    ): void => {
      createSendMessage(() => bc.onmessage?.(event))(
        event.data,
        topicName,
        schema,
        version,
      );
    },
    onmessageerror: (event: MessageEvent): void => bc?.onmessageerror?.(event),
    addEventListener: (
      eventType: "message",
      listener: (event: MessageEvent) => void,
      topicName?: string,
      schema?: JsonSchema,
      version?: number,
    ): void => {
      if (typeof topicName !== "string") {
        bc.addEventListener(eventType, listener);
        return;
      }
      receiver(
        topicNameToId(topicName, version),
        (payload) => {
          listener(new MessageEvent(eventType, { data: payload }));
        },
        () => {
          const topicId = topicNameToId(topicName, version);
          const newListener = (event: MessageEvent) => {
            if (schema) schemaManager.checkSchema(topicId, schema);
            dispatchOnSubscribe(
              topicId,
              _runnel.latestStateStoreMap?.get(topicId),
            );
            listener(event);
          };
          bc.addEventListener(eventType, newListener);
          // TODO: How can I return this?
          return function removeEventListener() {
            bc.removeEventListener(eventType, newListener);
          };
        },
      );
    },
    close: (): void => {
      bc?.close?.();
      _runnel.latestStateStoreMap?.clear();
      _runnel.schemaStoreMap?.clear();
      dispatchOnUnregisterAllTopics();
    },
    name: bc.name,
    getTopics: schemaManager.getTopics,
    getSchemaByTopicId: schemaManager.getSchemaByTopicId,
  };

  function createSendMessage(callback: () => void) {
    return function sendMessage(
      message: any,
      topicName?: string,
      schema?: JsonSchema,
      version?: number,
    ) {
      let _topicName = topicName;
      let _version = version;
      let _schema = schema;
      if (message !== null) {
        const _message =
          typeof message === "string" ? JSON.parse(message) : message;
        let _payload = _message;
        try {
          const {
            [_keys.topicNameKey]: topicName,
            [_keys.versionKey]: version,
            [_keys.schemaKey]: schema,
            [_keys.payloadKey]: payload,
          } = _message;
          _topicName = topicName ?? _topicName;
          _version = version ?? _version;
          _schema = schema ?? _schema;
          _payload = payload ?? _payload;
        } catch (e) {}
        if (_topicName && _schema && _payload) {
          const topicId = topicNameToId(_topicName, _version);
          sender(topicId, _schema, _payload, () => {
            if (_schema) schemaManager.checkSchema(topicId, _schema);
            callback();
          });
        } else {
          callback();
        }
      } else {
        callback();
      }
    };
  }
}
