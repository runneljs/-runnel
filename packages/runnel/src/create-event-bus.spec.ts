import { Validator } from "@cfworker/json-schema";
import isEqual from "lodash.isequal";
import { createEventBus, type TopicId } from "./index";
import type { GlobalType } from "./scope";

function payloadValidator(jsonSchema: object) {
  const validator = new Validator(jsonSchema);
  return function (payload: unknown) {
    return validator.validate(payload).valid;
  };
}

describe("create-event-bus", () => {
  let globalVar: GlobalType;

  beforeAll(() => {
    globalVar = {} as GlobalType;
  });

  let eventBus: ReturnType<typeof createEventBus>;
  beforeEach(() => {
    eventBus = createEventBus({
      deepEqual: isEqual,
      payloadValidator,
      globalVar,
    });
  });

  afterAll(() => {
    globalVar = {} as GlobalType;
  });

  describe("createEventBus", () => {
    test("it creates an eventBus", () => {
      expect(eventBus).toBeDefined();
    });
    test("it attaches things to the global objects", () => {
      expect(globalVar.__runnel.subscriptionStore).toBeDefined();
      expect(globalVar.__runnel.subscriptionStore?.size).toBe(0);
      expect(globalVar.__runnel.latestStateStoreMap).toBeDefined();
      expect(globalVar.__runnel.latestStateStoreMap?.size).toBe(0);
      expect(globalVar.__runnel.schemaStoreMap).toBeDefined();
      expect(globalVar.__runnel.schemaStoreMap?.size).toBe(0);
      expect(globalVar.__runnel.pluginStoresObservable).toBeDefined();
    });
  });
});

describe("Register two eventbuses. The latter has a plugin.", () => {
  let globalVar: GlobalType;
  let pubStore: any;
  let subStore: any;
  let eventBus1: ReturnType<typeof createEventBus>;
  let eventBus2: ReturnType<typeof createEventBus>;
  let mockPublish: ReturnType<typeof vi.fn>;
  let mockSubscribe: ReturnType<typeof vi.fn>;
  let subscriber: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    globalVar = {} as GlobalType;

    // Create an eventBus without a plugin.
    eventBus1 = createEventBus({
      deepEqual: isEqual,
      payloadValidator,
      globalVar,
    });

    // Create another eventBus with a plugin.
    pubStore = {};
    subStore = {};
    mockPublish = vi.fn();
    mockSubscribe = vi.fn();
    subscriber = vi.fn();
    eventBus2 = createEventBus({
      deepEqual: isEqual,
      payloadValidator,
      globalVar,
      pluginMap: new Map().set(globalVar, [
        {
          onCreatePublish: (topicId: TopicId) => {
            pubStore[topicId] = pubStore[topicId] ? pubStore[topicId] + 1 : 1;
          },
          onCreateSubscribe: (topicId: TopicId) => {
            subStore[topicId] = subStore[topicId] ? subStore[topicId] + 1 : 1;
          },
          publish: (topicId: TopicId, payload: unknown) => {
            mockPublish(topicId, payload);
            return `${payload} + 1`; // You could modify the payload here.
          },
          subscribe: (topicId: TopicId, payload: unknown) => {
            mockSubscribe(topicId, payload);
            return payload;
          },
        },
      ]),
    });
  });

  afterEach(() => {
    globalVar = {} as GlobalType;
  });

  test("it has two eventBus instances", () => {
    expect(eventBus1).toBeDefined();
    expect(eventBus2).toBeDefined();
  });

  test("it attaches things to the global objects", () => {
    expect(globalVar.__runnel.subscriptionStore).toBeDefined();
    expect(globalVar.__runnel.subscriptionStore?.size).toBe(0); // One topic
    expect(globalVar.__runnel.latestStateStoreMap).toBeDefined();
    expect(globalVar.__runnel.latestStateStoreMap?.size).toBe(0); // One publish event
    expect(globalVar.__runnel.schemaStoreMap).toBeDefined();
    expect(globalVar.__runnel.schemaStoreMap?.size).toBe(0); // One schema from one topic
    expect(globalVar.__runnel.pluginStoresObservable).toBeDefined();
  });

  describe("executes a publish event with the 2nd eventBus", () => {
    beforeEach(() => {
      const topic = eventBus2.registerTopic("testTopic1", { type: "string" });
      topic.publish("foo");
    });

    test("plugin gets the result", () => {
      // No subscribe
      expect(Object.keys(subStore).length).toBe(0);
      expect(subStore.testTopic1).not.toBeDefined();
      expect(subscriber).toHaveBeenCalledTimes(0);
      expect(mockSubscribe).toHaveBeenCalledTimes(0);

      // One publish
      expect(Object.keys(pubStore).length).toBe(1);
      expect(pubStore.testTopic1).toBeDefined();
      expect(mockPublish).toHaveBeenCalledTimes(1);

      expect(globalVar.__runnel.subscriptionStore?.size).toBe(1); // One topic
      expect(globalVar.__runnel.latestStateStoreMap?.size).toBe(1); // One publish event
      expect(globalVar.__runnel.schemaStoreMap?.size).toBe(1); // One schema from one topic
    });
  });

  describe("executes a publish event with the 1st eventBus", () => {
    beforeEach(() => {
      const topic = eventBus1.registerTopic("testTopic2", { type: "string" });
      topic.subscribe((payload) => subscriber(payload));
      topic.publish("foo");
    });

    test("plugin gets the result", () => {
      // One subscribe
      expect(Object.keys(subStore).length).toBe(1);
      expect(subStore.testTopic2).toBeDefined();
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(mockSubscribe).toHaveBeenCalledTimes(1);

      // One publish
      expect(Object.keys(pubStore).length).toBe(1);
      expect(pubStore.testTopic2).toBeDefined();
      expect(mockPublish).toHaveBeenCalledTimes(1);

      expect(globalVar.__runnel.subscriptionStore?.size).toBe(1); // One topic
      expect(globalVar.__runnel.latestStateStoreMap?.size).toBe(1); // One publish event
      expect(globalVar.__runnel.schemaStoreMap?.size).toBe(1); // One schema from one topic
    });
  });
});
