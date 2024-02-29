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
import isEqual from "lodash.isequal";
import { createEventBus, type Subscription } from "./index";

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

function payloadValidator(jsonSchema: object) {
  const validator = new Validator(jsonSchema);
  return function (payload: unknown) {
    return validator.validate(payload).valid;
  };
}

describe("EventBus", () => {
  describe("createEventBus", () => {
    beforeAll(() => {
      (global as any).mfeEventBusSubscriptionStore = undefined;
    });

    let eventBus: ReturnType<typeof createEventBus>;
    beforeEach(() => {
      eventBus = createEventBus({ deepEqual: isEqual, payloadValidator });
    });

    describe("createEventBus", () => {
      test("it creates an eventBus", () => {
        expect(eventBus).toBeDefined();
      });

      test("it attaches the eventBus store to the global object", () => {
        expect((global as any).mfeEventBusSubscriptionStore).toBeDefined();
      });
    });
  });

  describe("eventBus", () => {
    type EventBus = ReturnType<typeof createEventBus>;
    let eventBus: EventBus;
    beforeAll(() => {
      eventBus = createEventBus({ deepEqual: isEqual, payloadValidator });
    });

    afterEach(() => {
      eventBus.unregisterAllTopics();
    });

    describe("registerTopic", () => {
      describe("When registering a topic", () => {
        test("it creates a topic", () => {
          const testTopic = eventBus.registerTopic<TestSchema>(
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
              const topic1 = eventBus.registerTopic<TestSchema>(
                `test`,
                jsonSchema,
              );
              const topic2 = eventBus.registerTopic<TestSchema>(
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
              const topic1 = eventBus.registerTopic<TestSchema>(
                `test`,
                jsonSchema,
              );
              const topic2 = eventBus.registerTopic<TestSchema>(
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
            eventBus.registerTopic<TestSchema>(`test`, {
              ...jsonSchema,
              additionalProperties: false,
            });
            // Second - wrong schema!
            expect(() =>
              eventBus.registerTopic<TestSchema>(`test`, {
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
          const topic = eventBus.registerTopic(`test`, jsonSchema);
          eventBus.unregisterTopic(`test`);
          expect(() => topic.publish({ name: "test" })).not.toThrow();
        });
      });
    });
  });

  describe("topic", () => {
    type EventBus = ReturnType<typeof createEventBus>;
    let eventBus: EventBus;
    beforeEach(() => {
      eventBus = createEventBus({ deepEqual: isEqual, payloadValidator });
    });

    afterEach(() => {
      eventBus.unregisterAllTopics();
    });

    describe("When there is one topic", () => {
      let testTopic: ReturnType<typeof eventBus.registerTopic<TestSchema>>;
      beforeEach(() => {
        testTopic = eventBus.registerTopic<TestSchema>(`test`, jsonSchema);
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

    type EventBus = ReturnType<typeof createEventBus>;
    let eventBus: EventBus;
    beforeEach(() => {
      mock = jest.fn();
      const metricPlugin = () => {
        const subscribeStats: Record<
          string,
          { length: number; schema: object }
        > = {};
        const publishStats: Record<string, number> = {};

        return {
          onSubscribe: (topicId: string, subscription: Subscription) => {
            // This will have the latest info.
            subscribeStats[topicId] = {
              length: subscription.subscribers.size,
              schema: subscription.schema,
            };
          },
          onPublish: (topicId: string) => {
            publishStats[topicId]
              ? publishStats[topicId]++
              : (publishStats[topicId] = 1);
          },
          onUnregisterAllTopics: () => {
            mock([subscribeStats, publishStats]);
          },
        };
      };

      eventBus = createEventBus({
        deepEqual: isEqual,
        payloadValidator,
        plugins: [metricPlugin(), [global, [metricPlugin()]]],
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe("When there is one topic", () => {
      let testTopic: ReturnType<typeof eventBus.registerTopic<TestSchema>>;
      beforeEach(() => {
        testTopic = eventBus.registerTopic<TestSchema>(`skywalker`, jsonSchema);
      });

      describe("When a plugin gets registered", () => {
        test("it runs the plugin", () => {
          const callback = jest.fn();
          testTopic.subscribe(callback);
          testTopic.subscribe(callback);
          testTopic.publish({ name: "Anakin" });
          testTopic.publish({ name: "Luke" });
          testTopic.publish({ name: "Leia" });
          eventBus.unregisterAllTopics();
          // Yay! It has the metrics!
          expect(mock).toHaveBeenCalledWith([
            {
              skywalker: { length: 2, schema: jsonSchema },
            },
            { skywalker: 3 },
          ]);
        });
      });
    });
  });
});
