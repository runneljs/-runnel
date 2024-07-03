import { Validator } from "@cfworker/json-schema";
import deepEqual from "deep-equal";
import type { GlobalType } from "../scope";
import { metricPlugin } from "../test-utils/metric-plugin";
import {
  mockBroadcastChannel,
  resetMockBroadcastChannel,
} from "../test-utils/mock-broadcast-channel";
import { runnel, type RunnelBroadcastChannel } from "./index";

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

  describe("plugin", () => {
    let mock: ReturnType<typeof vi.fn>;
    let plugin: ReturnType<typeof metricPlugin>;

    beforeAll(() => {
      mock = vi.fn();
      plugin = metricPlugin(mock);
      plugin.register();
    });

    afterAll(() => {
      plugin.unregister();
    });

    afterEach(() => {
      mock.mockRestore();
    });

    describe("When there is one topic", () => {
      let mockEventListener: ReturnType<typeof vi.fn>;
      beforeEach(() => {
        mockEventListener = vi.fn();
      });

      afterEach(() => {
        mockEventListener.mockRestore();
      });

      test("should invoke the event listener three times", async () => {
        runnelBc.addEventListener(
          "message",
          (event) => {
            expect(Object.keys(event.data)).toEqual(["name"]);
            mockEventListener();
          },
          "skywalker",
          jsonSchema,
        );
        runnelBc.addEventListener(
          "message",
          (event) => {
            expect(Object.keys(event.data)).toEqual(["name"]);
            mockEventListener();
          },
          "skywalker",
          jsonSchema,
        );
        runnelBc.postMessage({ name: "Anakin" }, "skywalker", jsonSchema);
        runnelBc.postMessage({ name: "Luke" }, "skywalker", jsonSchema);
        runnelBc.postMessage({ name: "Leia" }, "skywalker", jsonSchema);
        expect(mockEventListener).toHaveBeenCalledTimes(6);
      });

      test("it runs the plugin", () => {
        runnelBc.close();
        expect(mock).toHaveBeenCalledWith({
          publishStats: { skywalker: 3 },
          subscribeStats: { skywalker: 2 },
          pubStats: { skywalker: 3 },
          subStats: { skywalker: 6 },
        });
        expect(mock).toHaveBeenCalledTimes(1);
      });
    });
  });
});
