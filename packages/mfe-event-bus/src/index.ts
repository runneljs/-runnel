type JsonSchema = object;
type UUID = string;
type TopicId = string;
type TopicName = string;
export type Subscription = {
  schema: JsonSchema;
  subscribers: Map<UUID, (payload: any) => void>;
};
type DeepEqual = (value: JsonSchema, other: JsonSchema) => boolean;
type Validator = (jsonSchema: JsonSchema) => (payload: unknown) => boolean;
type InitPlugIn = () => {
  onSubscribe?: (topicId: TopicId, subscription: Subscription) => void;
  onUnsubscribe?: (topicId: TopicId, subscription: Subscription) => void;
  onPublish?: (topicId: TopicId, subscription: Subscription) => void;
  onUnregisterAllTopics?: () => void;
};

export function createEventBus({
  deepEqual,
  payloadValidator,
  space = getGlobal(),
  plugins = {},
}: {
  deepEqual: DeepEqual;
  payloadValidator: Validator;
  space?: any;
  plugins?: Record<string, InitPlugIn>;
}): ReturnType<typeof eventBus> {
  const _global = space || (getGlobal() as any);
  _global.mfeEventBusSubscriptionStore ??= initSubscriptionStore();
  const subscriptionStore = _global.mfeEventBusSubscriptionStore;
  const pluginStore = initPluginStore({ subscriptionStore, plugins });

  return eventBus({
    deepEqual,
    payloadValidator,
    subscriptionStore,
    pluginStore,
  });
}

function eventBus({
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

type PlugInStore = ReturnType<typeof initPluginStore>;
function initPluginStore({
  subscriptionStore,
  plugins: _plugins,
}: {
  subscriptionStore: SubscriptionStore;
  plugins: Record<string, InitPlugIn>;
}) {
  type PlugIn = ReturnType<InitPlugIn>;
  const plugins: Map<string, PlugIn> = new Map(
    Object.entries(
      Object.entries(_plugins).reduce<Record<string, PlugIn>>(
        (acc, [name, init]) => {
          acc[name] = init();
          return acc;
        },
        {},
      ),
    ),
  );

  return {
    run: (eventName: keyof PlugIn, topicId?: TopicId): void => {
      plugins.forEach((plugin) => {
        eventName === "onUnregisterAllTopics"
          ? plugin[eventName]?.()
          : plugin[eventName]?.(topicId!, subscriptionStore.get(topicId!)!);
      });
    },
  };
}

type SubscriptionStore = ReturnType<typeof initSubscriptionStore>;
function initSubscriptionStore() {
  const subscriptionStore = new Map<TopicId, Subscription>();

  return {
    get: (topicId: TopicId): Subscription | undefined =>
      subscriptionStore.get(topicId),
    set: (topicId: TopicId, subscription: Subscription): void => {
      subscriptionStore.set(topicId, subscription);
    },
    delete: (topicId: TopicId): void => {
      subscriptionStore.delete(topicId);
    },
    clear: (): void => {
      subscriptionStore.clear();
    },
    update: (
      topicId: TopicId,
      uuid: UUID,
      subscriber?: (payload: any) => void,
    ) => {
      const { subscribers, ...rest } = subscriptionStore.get(topicId)!;
      subscriber ? subscribers.set(uuid, subscriber) : subscribers.delete(uuid);
      subscriptionStore.set(topicId, {
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
