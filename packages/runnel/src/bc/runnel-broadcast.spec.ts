import deepEqual from "deep-equal";
import type { GlobalType } from "../get-global";
import {
  mockBroadcastChannel,
  resetMockBroadcastChannel,
} from "../test-utils/mock-broadcast-channel";
import { payloadValidator } from "../test-utils/validator";
import { runnel, type RunnelBroadcastChannel } from "./index";

describe("runnel/bc", () => {
  let globalVar: GlobalType;
  let runnelBc: ReturnType<RunnelBroadcastChannel>;
  let broadcastChannel: BroadcastChannel;

  beforeAll(() => {
    mockBroadcastChannel();
    globalVar = {} as GlobalType;
    broadcastChannel = new BroadcastChannel("test");
    runnelBc = runnel(
      broadcastChannel,
      deepEqual,
      payloadValidator,
      undefined,
      globalVar,
    );
  });

  afterAll(() => {
    globalVar = {} as GlobalType;
    runnelBc.close();
    resetMockBroadcastChannel();
  });

  describe("init", () => {
    test("should create a new runnel", () => {
      expect(runnelBc).toBeDefined();
    });
    test("it attaches things to the global objects", () => {
      expect(globalVar.__runnel.latestStateStoreMap).toBeDefined();
      expect(globalVar.__runnel.latestStateStoreMap?.size).toBe(0);
      expect(globalVar.__runnel.schemaStoreMap).toBeDefined();
      expect(globalVar.__runnel.schemaStoreMap?.size).toBe(0);
    });
  });

  describe("postMessage/onmessage", () => {
    test("should send a message to the broadcast channel", () => {
      const foo = unique("bar");
      const mockListener = vi.fn();
      runnelBc.addEventListener("message", (event) => {
        mockListener(event.data);
      });
      runnelBc.postMessage(
        {
          foo,
        },
        "testTopic",
        { type: "object", properties: { foo: { type: "string" } } },
      );
      expect(mockListener).toHaveBeenCalledWith({
        foo,
      });
    });

    test("when the message is sent via onmessage", () => {
      const foo = unique("bar");
      const mockListener = vi.fn();
      runnelBc.addEventListener("message", (event) => {
        mockListener(event.data);
      });
      runnelBc.onmessage(
        new MessageEvent("message", {
          data: {
            foo,
          },
        }),
        "testTopic",
        { type: "object", properties: { foo: { type: "string" } } },
      );
      expect(mockListener).toHaveBeenCalledWith({
        foo,
      });
    });

    test("should not send a message when the payload is invalid", () => {
      expect(() =>
        runnelBc.postMessage(
          {
            foo: { invalid: "foo does not have a string" },
          },
          "testTopic",
          { type: "object", properties: { foo: { type: "string" } } },
        ),
      ).toThrow();
    });

    test("should not send a message when the schema is not consistent", () => {
      expect(() =>
        runnelBc.postMessage(
          {
            foo: "bar",
          },
          "testTopic",
          { type: "object", properties: { foo: { type: "number" } } },
        ),
      ).toThrow();
    });
  });

  describe("addEventListener", () => {
    let mock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mock = vi.fn();
    });

    afterEach(() => {
      mock.mockRestore();
    });

    test("event listener should be invoked for existing event", () => {
      runnelBc.addEventListener("message", mock, "testTopic");
      expect(mock).toHaveBeenCalledTimes(1);
    });

    test("event listener should not be invoked for non-existing event (version '1')", () => {
      runnelBc.addEventListener(
        "message",
        mock,
        "testTopic",
        { type: "object", properties: { foo: { type: "string" } } },
        1,
      );
      expect(mock).toHaveBeenCalledTimes(0);
    });
  });
});

function unique(s: string) {
  return `${s}-${Math.random()}`;
}
