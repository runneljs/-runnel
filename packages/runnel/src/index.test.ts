import { Validator } from "@cfworker/json-schema";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";
import isEqual from "lodash.isequal";
import { createEventBus, type Plugin, type TopicId } from "./index";

function payloadValidator(jsonSchema: object) {
  const validator = new Validator(jsonSchema);
  return function (payload: unknown) {
    return validator.validate(payload).valid;
  };
}

const store = {} as any;
const plugin = (): Plugin => {
  return {
    onCreatePublish: (topicId: TopicId) => {
      store[topicId] = 1;
    },
    onCreateSubscribe: (topicId: TopicId) => {
      store[topicId] = 1;
    },
  };
};

describe("index", () => {
  let globalScope: any;
  beforeAll(() => {
    globalScope = {};
  });

  let eventBus: ReturnType<typeof createEventBus>;
  beforeEach(() => {
    eventBus = createEventBus({
      deepEqual: isEqual,
      payloadValidator,
      scope: globalScope,
    });
  });

  afterEach(() => {
    globalScope = {};
  });

  describe("createEventBus", () => {
    test("it creates an eventBus", () => {
      expect(eventBus).toBeDefined();
    });
    test("it attaches things to the global objects", () => {
      expect(globalScope.runnelSubscriptionStore).toBeDefined();
      expect(globalScope.runnelSubscriptionStore.size).toBe(0);
      expect(globalScope.runnelLatestStateStore).toBeDefined();
      expect(globalScope.runnelLatestStateStore.size).toBe(0);
      expect(globalScope.runnelSchemaStore).toBeDefined();
      expect(globalScope.runnelSchemaStore.size).toBe(0);
      expect(globalScope.runnelPluginStore).not.toBeDefined();
    });
  });

  describe("Register two eventbus", () => {
    let eventBus2: ReturnType<typeof createEventBus>;
    beforeEach(() => {
      const eventBus = createEventBus({
        deepEqual: isEqual,
        payloadValidator,
        scope: globalScope,
      });

      eventBus2 = createEventBus({
        deepEqual: isEqual,
        payloadValidator,
        scope: globalScope,
        pluginMap: new Map().set(globalScope, [plugin()]),
      });
    });

    afterEach(() => {
      globalScope = {};
    });

    test("it creates another eventBus", () => {
      expect(eventBus2).toBeDefined();
    });

    test("it attaches things to the global objects", () => {
      expect(globalScope.runnelSubscriptionStore).toBeDefined();
      expect(globalScope.runnelSubscriptionStore.size).toBe(0); // One topic
      expect(globalScope.runnelLatestStateStore).toBeDefined();
      expect(globalScope.runnelLatestStateStore.size).toBe(0); // One publish event
      expect(globalScope.runnelSchemaStore).toBeDefined();
      expect(globalScope.runnelSchemaStore.size).toBe(0); // One schema from one topic
      expect(globalScope.runnelPluginStore).toBeDefined();
      expect(globalScope.runnelPluginStore.size()).toBe(1); // One plugin
    });

    test("plugin gets the result", () => {
      // Create a topic with the previous eventBus.
      const topic = eventBus.registerTopic("testTopic1", { type: "string" });
      topic.publish("foo");

      expect(Object.keys(store).length).toBe(1);
      expect(store.testTopic1).toBeDefined();

      expect(globalScope.runnelSubscriptionStore.size).toBe(1); // One topic
      expect(globalScope.runnelLatestStateStore.size).toBe(1); // One publish event
      expect(globalScope.runnelSchemaStore.size).toBe(1); // One schema from one topic
    });
  });
});
