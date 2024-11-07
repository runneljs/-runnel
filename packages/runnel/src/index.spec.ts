import { runnel } from "./index";
import { createLogObserver } from "./log-observer";

type TestSchema = {
  str: string;
  num: number;
  obj: { primaryKey: string; secondaryKey: number; optional?: string };
  arr: string[];
  tuple: [string, number, { primaryKey: string; secondaryKey: number }];
  nv: never;
};

describe("runnel", () => {
  const { registerTopic } = runnel<TestSchema>();

  describe("registerTopic", () => {
    let logs: unknown[] = [];
    beforeAll(() => {
      createLogObserver((log) => {
        logs.push(log);
      });
      registerTopic("str");
    });

    it("allows to register a topic that exists in the schema", () => {
      expect(logs.length).toEqual(1);
      expect(logs.at(-1)).toEqual({
        name: "onCreateTopic",
        detail: { topicId: "str" },
      });
    });
  });

  describe("publish", () => {
    let logs: unknown[] = [];
    let strTopic: ReturnType<typeof registerTopic<"str">>;

    beforeAll(() => {
      createLogObserver((log) => {
        logs.push(log);
      });
      strTopic = registerTopic("str");
      strTopic.publish("test - this is a string");
    });

    it("allows to publish a payload to a topic", () => {
      expect(logs.length).toBe(2);
      expect(logs.at(-1)).toEqual({
        name: "onPostMessage",
        detail: {
          topicId: "str",
        },
      });
    });

    describe("subscribe", () => {
      describe("subscribe to a topic that has existed", () => {
        let logs: unknown[] = [];
        let spy: ReturnType<typeof vi.fn>;
        beforeAll(() => {
          spy = vi.fn();
          createLogObserver((log) => {
            logs.push(log);
          });
        });
        afterAll(() => {
          vi.restoreAllMocks();
        });

        it("allows to subscribe to a topic - receives the last published payload", () => {
          strTopic.subscribe((payload) => {
            expect(payload).toBe("test - this is a string");
            spy();
          });
          expect(spy).toHaveBeenCalled();
          expect(logs.length).toBe(2);
          expect(logs.at(0)).toEqual({
            name: "onAddEventListener",
            detail: { topicId: "str" },
          });
          expect(logs.at(-1)).toEqual({
            name: "onPostMessage",
            detail: { topicId: "str" },
          });
        });
      });

      describe("subscribe to a topic that has not existed", () => {
        let logs: unknown[] = [];
        let spy: ReturnType<typeof vi.fn>;
        let numTopic: ReturnType<typeof registerTopic<"num">>;
        let unsubscribe: () => void;
        let logObserver: () => void;
        beforeAll(() => {
          logObserver = createLogObserver((log) => {
            logs.push(log);
          });
          numTopic = registerTopic("num");
          spy = vi.fn();
          unsubscribe = numTopic.subscribe(spy);
        });
        afterAll(() => {
          vi.restoreAllMocks();
          logObserver();
        });

        it("allows to subscribe to a topic - receives the last published payload", () => {
          expect(spy).not.toHaveBeenCalled();
          expect(logs.length).toBe(2);
          expect(logs.at(-1)).toEqual({
            name: "onAddEventListener",
            detail: { topicId: "num" },
          });
        });

        describe("unsubscribe", () => {
          it("allows to unsubscribe from a topic", () => {
            unsubscribe();
            expect(logs.length).toBe(3);
            expect(logs.at(-1)).toEqual({
              name: "onRemoveEventListener",
              detail: { topicId: "num" },
            });
          });
        });
      });

      describe("subscribe to a topic that exists", () => {
        let logs: unknown[] = [];
        let spy: ReturnType<typeof vi.fn>;
        let arrTopic: ReturnType<typeof registerTopic<"arr">>;
        let logObserver: () => void;
        beforeAll(() => {
          logObserver = createLogObserver((log) => {
            logs.push(log);
          });
          spy = vi.fn();
          arrTopic = registerTopic("arr");
          arrTopic.subscribe((payload) => spy(payload));
          arrTopic.publish(["test", "this", "is", "an", "array"]);
        });
        afterAll(() => {
          vi.restoreAllMocks();
          logObserver();
        });

        it("subscribes to a topic", () => {
          expect(spy).toHaveBeenCalled();
          expect(logs.length).toBe(3);
          expect(logs.at(-2)).toEqual({
            name: "onAddEventListener",
            detail: { topicId: "arr" },
          });
          expect(logs.at(-1)).toEqual({
            name: "onPostMessage",
            detail: {
              topicId: "arr",
            },
          });
        });
      });
    });
  });
});
