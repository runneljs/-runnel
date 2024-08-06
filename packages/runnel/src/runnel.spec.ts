import deepEqual from "deep-equal";
import {
  onAddEventListenerEventName,
  onPostMessageEventName,
  onRemoveEventListenerEventName,
} from "./dispatch-events";
import { type RegisterTopic, type Runnel, runnel } from "./runnel";
import {
  mockBroadcastChannel,
  resetMockBroadcastChannel,
} from "./test-utils/mock-broadcast-channel";
import { payloadValidator } from "./test-utils/validator";

type TestSchema = {
  name: string;
  age?: number;
};

const testJsonSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" },
  },
  required: ["name"],
  additionalProperties: false,
  $schema: "http://json-schema.org/draft-07/schema#",
};

describe("runnel-bc", () => {
  let channel: Runnel;
  let channelName: string;

  beforeAll(() => {
    mockBroadcastChannel();
    channelName = unique("test-channel");
    channel = runnel(channelName, deepEqual, payloadValidator);
  });

  afterAll(() => {
    channel?.close();
    resetMockBroadcastChannel();
  });

  describe("Registering a topic", () => {
    let topicName: string;
    const schema = {
      ...testJsonSchema,
      properties: { name: { type: "string" } },
    };
    beforeEach(() => {
      topicName = unique("test-topic");
      channel.registerTopic(topicName, testJsonSchema);
    });

    it("allows to register a topic with a different version and a different schema", () => {
      channel.registerTopic(topicName, schema, { version: 2 });
    });
    it("does not allow to register a topic with the same version", () => {
      expect(() => {
        channel.registerTopic(topicName, schema);
      }).toThrow();
    });
  });

  describe("Publishing to a topic", () => {
    let topic: ReturnType<RegisterTopic>;
    let mockOnPublishEvent: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      const topicName = unique("test-topic");
      topic = channel.registerTopic(topicName, testJsonSchema);
      mockOnPublishEvent = vi.fn();
      window.addEventListener(onPostMessageEventName, mockOnPublishEvent);
    });

    afterEach(() => {
      vi.restoreAllMocks();
      window.removeEventListener(onPostMessageEventName, mockOnPublishEvent);
    });

    it("allows to publish to a topic expected by the schema", () => {
      expect(mockOnPublishEvent).not.toHaveBeenCalled();
      topic.publish({ name: "test" });
      expect(mockOnPublishEvent).toHaveBeenCalled();
    });

    it("allows to publish to a topic expected by the schema", () => {
      topic.publish({ name: "test", age: 1 });
    });

    it("does not allow to publish to a topic with a different schema", () => {
      expect(() => {
        topic.publish({ name: "test", age: "1" });
      }).toThrow();
    });
  });

  describe("Subscribing to a topic", () => {
    let topic: ReturnType<RegisterTopic>;
    let mockOnSubscribeCreatedEvent: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      const topicName = unique("test-topic");
      topic = channel.registerTopic(topicName, testJsonSchema);
      mockOnSubscribeCreatedEvent = vi.fn();
      window.addEventListener(
        onAddEventListenerEventName,
        mockOnSubscribeCreatedEvent,
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
      window.removeEventListener(
        onAddEventListenerEventName,
        mockOnSubscribeCreatedEvent,
      );
    });

    it("allows to subscribe to a topic", () => {
      expect(mockOnSubscribeCreatedEvent).not.toHaveBeenCalled();
      topic.subscribe(vi.fn());
      expect(mockOnSubscribeCreatedEvent).toHaveBeenCalled();
    });
  });

  describe("Unsubscribing from a topic", () => {
    let topic: ReturnType<RegisterTopic>;
    let topicName: string;
    let mockOnUnsubscribeEvent: ReturnType<typeof vi.fn>;
    let broadcastChannelEventListener: ReturnType<typeof vi.fn>;
    let subscriber: ReturnType<typeof vi.fn>;
    let unsubscribe: () => void;

    beforeEach(() => {
      topicName = unique("test-topic");
      topic = channel.registerTopic(topicName, testJsonSchema);
      mockOnUnsubscribeEvent = vi.fn();
      window.addEventListener(
        onRemoveEventListenerEventName,
        mockOnUnsubscribeEvent,
      );
      broadcastChannelEventListener = vi.fn();
      subscriber = vi.fn();
      unsubscribe = topic.subscribe(subscriber);
    });

    afterEach(() => {
      vi.restoreAllMocks();
      window.removeEventListener(
        onRemoveEventListenerEventName,
        mockOnUnsubscribeEvent,
      );
    });

    it("allows to unsubscribe from a topic", () => {
      // Directly posting a message to the topic.
      const bc = new BroadcastChannel(channelName);
      bc.addEventListener("message", broadcastChannelEventListener);
      bc.postMessage({ topicId: topicName });
      expect(broadcastChannelEventListener).toHaveBeenCalled();
      expect(subscriber).toHaveBeenCalled();

      broadcastChannelEventListener.mockReset();
      subscriber.mockReset();

      expect(mockOnUnsubscribeEvent).not.toHaveBeenCalled();
      expect(subscriber).not.toHaveBeenCalled();
      unsubscribe();
      expect(mockOnUnsubscribeEvent).toHaveBeenCalled();
      bc.postMessage({ topicId: topicName });
      expect(broadcastChannelEventListener).toHaveBeenCalled();
      // TODO: mock-broadcast-channel doesn't support removing listeners.
      // expect(subscriber).not.toHaveBeenCalled();
    });
  });
});

function unique(s: string) {
  return `${s}-${Math.random()}`;
}
