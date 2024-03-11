import { Validator } from "@cfworker/json-schema";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "bun:test";
import deepEqual from "deep-equal";
import { SubscriptionStore } from "./SubscriptionStore";
import { eventBus, type EventBus } from "./event-bus";
import { mapPlugins } from "./map-plugins";
import type { JsonSchema } from "./primitive-types";
import { createPluginEmitter } from "./run-plugins";
import { schemaManager } from "./schema-manager";

type TestSchema = {
  name: string;
  age?: number | undefined;
};
const jsonSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
    },
    age: {
      type: "number",
    },
  },
  required: ["name"],
  additionalProperties: false,
  $schema: "http://json-schema.org/draft-07/schema#",
};

const pluginEmitter = createPluginEmitter(new Map(), global);

function payloadValidator(jsonSchema: object) {
  const validator = new Validator(jsonSchema);
  return function (payload: unknown) {
    return validator.validate(payload).valid;
  };
}

describe("EventBus", () => {
  describe("eventBus", () => {
    let latestStateStore: Map<string, unknown>;
    let subscriptionStore: SubscriptionStore;
    let _eventBus: EventBus;
    beforeAll(() => {
      latestStateStore = new Map();
      subscriptionStore = new SubscriptionStore();
      const checkSchema = schemaManager(deepEqual, new Map());
      _eventBus = eventBus({
        latestStateStore,
        subscriptionStore,
        checkSchema,
        pluginEmitter,
        payloadValidator,
      });
    });

    afterEach(() => {
      _eventBus.unregisterAllTopics();
    });

    describe("registerTopic", () => {
      describe("When registering a topic", () => {
        test("it creates a topic", () => {
          const testTopic = _eventBus.registerTopic<TestSchema>(
            `test`,
            jsonSchema,
          );
          expect(testTopic).toBeDefined();
        });
      });

      describe("When registering two topics", () => {
        describe("they have the same schema", () => {
          /**
           * The case multiple micro-frontend apps register the same topic info.
           * It is common, they cannot communicate each other without this.
           */
          describe("AND they have the same topic name", () => {
            test("it creates two topics", () => {
              const topic1 = _eventBus.registerTopic<TestSchema>(
                `test`,
                jsonSchema,
              );
              const topic2 = _eventBus.registerTopic<TestSchema>(
                `test`,
                jsonSchema,
              );
              expect(topic1).toBeDefined();
              expect(topic2).toBeDefined();
              expect(topic1).not.toBe(topic2);
            });
          });

          describe("AND they have a different topic name", () => {
            test("it creates two topics", () => {
              const topic1 = _eventBus.registerTopic<TestSchema>(
                `test`,
                jsonSchema,
              );
              const topic2 = _eventBus.registerTopic<TestSchema>(
                `test2`,
                jsonSchema,
              );
              expect(topic1).toBeDefined();
              expect(topic2).toBeDefined();
              expect(topic1).not.toBe(topic2);
            });
          });
        });

        describe("they have different schemas", () => {
          /**
           * Because we do not have a central place to store schemas for multiple micro-frontend apps,
           * we need to give a schema when we register a topic.
           * Of course, every micro-frontend app can have its own central place to store schemas.
           */
          test("it throws an error", () => {
            // First
            _eventBus.registerTopic<TestSchema>(`test`, {
              ...jsonSchema,
              additionalProperties: false,
            });
            // Second - wrong schema!
            expect(() =>
              _eventBus.registerTopic<TestSchema>(`test`, {
                ...jsonSchema,
                additionalProperties: true,
              }),
            ).toThrow();
          });
        });
      });
    });

    describe("unregisterTopic", () => {
      describe("When unregistering a topic", () => {
        test("it removes the topic but you can keep sending a message", () => {
          const topic = _eventBus.registerTopic(`test`, jsonSchema, {
            version: 1,
          });
          _eventBus.unregisterTopic(`test`, { version: 1 });
          expect(() => topic.publish({ name: "test" })).not.toThrow();
        });
        test("It should fail when a wrrong version is specified", () => {
          const topic = _eventBus.registerTopic(`test`, jsonSchema, {
            version: 1,
          });
          expect(() =>
            _eventBus.unregisterTopic(`test`, { version: 2 }),
          ).toThrow();
        });
      });
    });
  });

  describe("topic", () => {
    let latestStateStore: Map<string, unknown>;
    let subscriptionStore: SubscriptionStore;
    let _eventBus: EventBus;
    beforeAll(() => {
      latestStateStore = new Map();
      subscriptionStore = new SubscriptionStore();
      const checkSchema = schemaManager(deepEqual, new Map());
      _eventBus = eventBus({
        latestStateStore,
        subscriptionStore,
        checkSchema,
        pluginEmitter,
        payloadValidator,
      });
    });

    afterEach(() => {
      _eventBus.unregisterAllTopics();
    });

    describe("When there is one topic", () => {
      let testTopic: ReturnType<typeof _eventBus.registerTopic<TestSchema>>;

      beforeEach(() => {
        _eventBus.unregisterAllTopics();
        testTopic = _eventBus.registerTopic<TestSchema>(`test`, jsonSchema, {
          version: 1,
        });
      });

      describe("AND it has no subscribers", () => {
        test("it publishes a message", () => {
          expect(() => testTopic.publish({ name: "test" })).not.toThrow();
        });
      });

      describe("AND it has one subscriber", () => {
        test("it publishes a message", () => {
          const callback = jest.fn();
          testTopic.subscribe(callback);
          testTopic.publish({ name: "test" });
          expect(callback).toHaveBeenCalledWith({ name: "test" });
        });
      });

      describe("AND it has two subscribers", () => {
        describe("AND publish once", () => {
          test("it publishes a message", () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            testTopic.subscribe(callback1);
            testTopic.subscribe(callback2);
            testTopic.publish({ name: "test" });
            expect(callback1).toHaveBeenCalledWith({ name: "test" });
            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledWith({ name: "test" });
            expect(callback2).toHaveBeenCalledTimes(1);
          });

          test("it publishes two messages", () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();
            testTopic.subscribe(callback1);
            testTopic.subscribe(callback2);
            testTopic.publish({ name: "test1" });
            testTopic.publish({ name: "test2" });
            expect(callback1).toHaveBeenCalledWith({ name: "test1" });
            expect(callback1).toHaveBeenCalledWith({ name: "test2" });
            expect(callback1).toHaveBeenCalledTimes(2);
            expect(callback2).toHaveBeenCalledWith({ name: "test1" });
            expect(callback2).toHaveBeenCalledWith({ name: "test2" });
            expect(callback2).toHaveBeenCalledTimes(2);
          });
        });
      });

      describe("AND it publishes a wrong message", () => {
        test("it throws an error", () => {
          /** @ts-ignore */
          expect(() => testTopic.publish({ name: 1 })).toThrow(Error);
        });
      });

      describe("AND a new topic with the same name is registered", () => {
        test("The second topic's subscriber gets called with latest published payload", () => {
          const callback1 = jest.fn();
          testTopic.subscribe(callback1);
          expect(callback1).not.toHaveBeenCalled();
          testTopic.publish({ name: "test" });
          testTopic.publish({ name: "twice" });
          expect(callback1).toHaveBeenCalledTimes(2);
          expect(callback1).toHaveBeenCalledWith({ name: "twice" });

          // New topic subscribes the same topic id.
          const additionalTopic = _eventBus.registerTopic<TestSchema>(
            `test`,
            jsonSchema,
            { version: 1 },
          );
          const callback2 = jest.fn();
          expect(callback2).not.toHaveBeenCalled();
          additionalTopic.subscribe(callback2);
          expect(callback2).not.toHaveBeenCalledWith({ name: "test" });
          expect(callback2).toHaveBeenCalledWith({ name: "twice" });
          expect(callback2).toHaveBeenCalledTimes(1);
        });
      });

      describe("AND unsubscribe it", () => {
        test("it does not publish a message", () => {
          const callback = jest.fn();
          const unsubscribe = testTopic.subscribe(callback);
          unsubscribe();
          testTopic.publish({ name: "test" });
          expect(callback).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe("plugin", () => {
    let mock: jest.Mock;
    let schemaReceiver: jest.Mock;
    let latestStateStore: Map<string, unknown>;
    let subscriptionStore: SubscriptionStore;
    let _eventBus: EventBus;
    const schemaStore = new Map();
    beforeAll(() => {
      mock = jest.fn();
      schemaReceiver = jest.fn();
      latestStateStore = new Map();
      subscriptionStore = new SubscriptionStore();
      const metricPlugin = () => {
        const subscribeStats: Record<string, number> = {};
        const publishStats: Record<string, number> = {};
        const subStats: Record<string, number> = {};
        const pubStats: Record<string, number> = {};
        let schema = {};

        return {
          // when `subscribe` is introduced.
          onCreateSubscribe: (topicId: string, _schema: JsonSchema) => {
            schema = _schema;
            subscribeStats[topicId]
              ? subscribeStats[topicId]++
              : (subscribeStats[topicId] = 1);
          },
          // when `publish` is introduced.
          onCreatePublish: (topicId: string) => {
            publishStats[topicId]
              ? publishStats[topicId]++
              : (publishStats[topicId] = 1);
          },
          onUnregisterAllTopics: () => {
            mock({ subscribeStats, publishStats, pubStats, subStats });
            schemaReceiver({ schema });
          },
          // when pub-sub communication happens. On the publish side.
          publish: (
            topicId: string,
            payload: { name: string },
          ): { name: string } => {
            pubStats[topicId] ? pubStats[topicId]++ : (pubStats[topicId] = 1);
            return { ...payload, name: payload.name + "?" };
          },
          // when pub-sub communication happens. On the subscribe side.
          subscribe: (
            topicId: string,
            payload: { name: string },
          ): { name: string } => {
            subStats[topicId] ? subStats[topicId]++ : (subStats[topicId] = 1);
            return { ...payload, name: payload.name.replace(/\?$/, "") };
          },
        };
      };
      const pluginMap = new Map().set(undefined, [metricPlugin()]);
      // .set(global, [metricPlugin()]);

      const pluginEmitter = createPluginEmitter(
        mapPlugins(schemaStore, pluginMap),
        global,
      );
      const checkSchema = schemaManager(deepEqual, schemaStore);

      _eventBus = eventBus({
        latestStateStore,
        subscriptionStore,
        checkSchema,
        pluginEmitter,
        payloadValidator,
      });
    });

    afterEach(() => {
      _eventBus.unregisterAllTopics();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe("When there is one topic", () => {
      let testTopic: ReturnType<typeof _eventBus.registerTopic<TestSchema>>;
      beforeEach(() => {
        testTopic = _eventBus.registerTopic<TestSchema>(
          `skywalker`,
          jsonSchema,
        );
      });

      describe("When a plugin gets registered", () => {
        beforeEach(() => {
          const callback = jest.fn();
          const cbWrapper = (payload: { name: string }) => {
            callback(payload);
          };
          testTopic.subscribe(cbWrapper);
          testTopic.subscribe(cbWrapper);
          testTopic.publish({ name: "Anakin" });
          testTopic.publish({ name: "Luke" });
          testTopic.publish({ name: "Leia" });
          expect(callback).toHaveBeenCalledTimes(6);
          expect(callback).toHaveBeenCalledWith({ name: "Anakin" });
          expect(callback).toHaveBeenCalledWith({ name: "Luke" });
          expect(callback).toHaveBeenCalledWith({ name: "Leia" });

          // Additional subscriber is added. It should receive the latest payload.
          _eventBus
            .registerTopic<TestSchema>(`skywalker`, jsonSchema)
            .subscribe(cbWrapper);
          expect(callback).toHaveBeenCalledTimes(7);
          _eventBus.unregisterAllTopics();
        });

        afterEach(() => {
          jest.restoreAllMocks();
        });

        test("it runs the plugin", () => {
          // Yay! It has the metrics!
          expect(mock).toHaveBeenCalledWith({
            subscribeStats: {
              skywalker: 2 + 1, // +1 for the additional subscriber.
            },
            publishStats: { skywalker: 3 },
            pubStats: { skywalker: 3 },
            subStats: { skywalker: 6 + 1 }, // +1 for the additional subscriber.
          });
          expect(mock).toHaveBeenCalledTimes(1);
          expect(schemaReceiver).toHaveBeenCalledWith({
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                age: {
                  type: "number",
                },
              },
              required: ["name"],
              additionalProperties: false,
              $schema: "http://json-schema.org/draft-07/schema#",
            },
          });
          expect(schemaReceiver).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});
