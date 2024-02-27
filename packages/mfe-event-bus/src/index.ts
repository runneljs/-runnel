type JsonSchema = object;
type UUID = string;
type TopicId = string;
type TopicName = string;
type DeepEqual = (value: JsonSchema, other: JsonSchema) => boolean;
type Validator = (jsonSchema: JsonSchema) => (payload: unknown) => boolean;

export function createEventBus({
  deepEqual,
  payloadValidator,
}: {
  deepEqual: DeepEqual;
  payloadValidator: Validator;
}): ReturnType<typeof eventBus> {
  const _global = getGlobal() as any;
  _global.mfeEventBusStore ??= initMutableStore();
  return eventBus({
    deepEqual,
    payloadValidator,
    mutableStore: _global.mfeEventBusStore,
  });
}

function eventBus({
  deepEqual,
  payloadValidator,
  mutableStore,
}: {
  deepEqual: DeepEqual;
  payloadValidator: Validator;
  mutableStore: MutableStore;
}) {
  function registerTopic<T>(
    topicName: TopicName,
    jsonSchema: JsonSchema,
    options?: { version?: string },
  ) {
    const { version } = options ?? {};
    const topicId = topicNameToId(topicName, version);
    const { schema, subscribers } = mutableStore.get(topicId) || {
      schema: jsonSchema,
      subscribers: new Map<UUID, <T>(payload: T) => void>(),
    };
    if (!deepEqual(jsonSchema, schema)) {
      throw new SchemaMismatchError(topicId, schema, jsonSchema);
    }
    mutableStore.set(topicId, { schema, subscribers });

    const subscribe = (callback: (payload: T) => void) => {
      const uuid = crypto.randomUUID();
      mutableStore.update(topicId, uuid, callback);
      return function unsubscribe() {
        mutableStore.update(topicId, uuid);
      };
    };

    const publish = (payload: T) => {
      if (!payloadValidator(schema)(payload)) {
        throw new PayloadMismatchError(topicId, schema, payload);
      }
      mutableStore
        .get(topicId)
        ?.subscribers.forEach((callback: (payload: T) => void) => {
          callback(payload);
        });
    };

    return { subscribe, publish };
  }

  function unregisterTopic(topicName: TopicName, options?: { version?: "1" }) {
    const { version } = options ?? {};
    mutableStore.delete(topicNameToId(topicName, version));
  }

  function unregisterAllTopics() {
    mutableStore.clear();
  }

  return { registerTopic, unregisterTopic, unregisterAllTopics };
}

function topicNameToId(topicName: TopicName, version?: string) {
  return `${topicName}${typeof version === "string" && version.length > 0 ? `@${version}` : ""}`;
}

type MutableStore = ReturnType<typeof initMutableStore>;
function initMutableStore() {
  type Subscription = {
    schema: JsonSchema;
    subscribers: Map<UUID, (payload: any) => void>;
  };
  const subscriptionMap = new Map<TopicId, Subscription>();

  return {
    get: (topicId: TopicId): Subscription | undefined =>
      subscriptionMap.get(topicId),
    set: (topicId: TopicId, subscription: Subscription): void => {
      subscriptionMap.set(topicId, subscription);
    },
    delete: (topicId: TopicId): void => {
      subscriptionMap.delete(topicId);
    },
    clear: (): void => {
      subscriptionMap.clear();
    },
    update: (
      topicId: TopicId,
      uuid: UUID,
      subscriber?: (payload: any) => void,
    ) => {
      const { subscribers, ...rest } = subscriptionMap.get(topicId)!;
      subscriber ? subscribers.set(uuid, subscriber) : subscribers.delete(uuid);
      subscriptionMap.set(topicId, {
        ...rest,
        subscribers,
      });
    },
  };
}

function getGlobal() {
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw new Error("No global object found. Please create a PR to support it.");
}

export class PayloadMismatchError extends Error {
  constructor(
    public topicName: TopicName,
    public jsonSchema: JsonSchema,
    public payload: unknown,
  ) {
    super(
      [
        `Invalid payload for the topic [${topicName}].`,
        `Please make sure the payload matches the schema.`,
        `JSON Schema:${JSON.stringify(jsonSchema)}`,
        `Payload:${JSON.stringify(payload)}`,
      ].join("\n"),
    );
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PayloadMismatchError);
    }
    this.name = PayloadMismatchError.name;
  }
}

export class SchemaMismatchError extends Error {
  constructor(
    public topicName: TopicName,
    public jsonSchema: JsonSchema,
    public incomingJsonSchema: unknown,
  ) {
    super(
      [
        `The topic [${topicName}] has been registered with a different schema.`,
        `Expected:${JSON.stringify(jsonSchema)},`,
        `Received:${JSON.stringify(incomingJsonSchema)}`,
      ].join("\n"),
    );
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SchemaMismatchError);
    }
    this.name = SchemaMismatchError.name;
  }
}

export default createEventBus;
