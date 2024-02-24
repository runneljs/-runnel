type JsonSchema = object;
type UUID = string;
type TopicName = string;

export function createEventBus(
  deepEqual: (value: JsonSchema, other: JsonSchema) => boolean,
  payloadValidator: (jsonSchema: JsonSchema) => (payload: unknown) => boolean,
) {
  function eventBus() {
    const subscriptionMap = new Map<
      TopicName,
      { schema: JsonSchema; subscribers: Map<UUID, (payload: any) => void> }
    >();

    function registerTopic<T>(topicName: TopicName, jsonSchema: JsonSchema) {
      const { schema, subscribers } = subscriptionMap.get(topicName) || {
        schema: jsonSchema,
        subscribers: new Map<UUID, <T>(payload: T) => void>(),
      };
      if (!deepEqual(jsonSchema, schema)) {
        throw new SchemaMismatchError(topicName, schema, jsonSchema);
      }
      subscriptionMap.set(topicName, { schema, subscribers });

      return {
        subscribe: (callback: (payload: T) => void) => {
          const { schema, subscribers } = subscriptionMap.get(topicName)!;
          const uuid = crypto.randomUUID();
          subscribers.set(uuid, callback);
          subscriptionMap.set(topicName, {
            schema,
            subscribers,
          });
          return function unsubscribe() {
            const { schema, subscribers } = subscriptionMap.get(topicName)!;
            subscribers.delete(uuid);
            subscriptionMap.set(topicName, {
              schema,
              subscribers,
            });
          };
        },
        publish: (payload: T) => {
          if (!payloadValidator(schema)(payload)) {
            throw new PayloadMismatchError(topicName, schema, payload);
          }
          subscriptionMap
            .get(topicName)
            ?.subscribers.forEach((callback: (payload: T) => void) => {
              callback(payload);
            });
        },
      };
    }

    function unregisterTopic(topicName: TopicName) {
      subscriptionMap.delete(topicName);
    }

    function unregisterAllTopics() {
      subscriptionMap.clear();
    }

    return { registerTopic, unregisterTopic, unregisterAllTopics };
  }
  const _global = getGlobal() as any;
  _global.mfeEventBus ??= eventBus();
  return _global.mfeEventBus as ReturnType<typeof eventBus>;
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
