import type { Plugin, TopicId } from "../primitive-types";
import { PluginStore, chainPlugins } from "./PluginStore";

describe("chainPlugins", () => {
  describe("when the length of functions is zero", () => {
    test("should return payload", () => {
      expect(chainPlugins([])("topicId", "payload")).toEqual("payload");
    });
  });
  describe("when the length of functions is one", () => {
    test("should return a modified payload", () => {
      expect(
        chainPlugins([(_topicId: TopicId, payload: unknown) => `${payload}+`])(
          "topicId",
          "payload",
        ),
      ).toEqual("payload+");
    });
  });
});

describe("PluginStore", () => {
  describe("when there are no plugins", () => {
    let pluginStore: PluginStore;

    beforeEach(() => {
      pluginStore = new PluginStore();
    });

    test("size", () => {
      expect(pluginStore.size()).toBe(0);
    });

    describe("pubChain", () => {
      test("should not return undefined", () => {
        expect(pluginStore.publishEvent()).not.toBeUndefined();
      });

      test("the return value is callable", () => {
        const pubChain = pluginStore.publishEvent();
        expect(() => pubChain("topicId", "payload")).not.toThrow();
      });
    });

    describe("subChain", () => {
      test("should not return undefined", () => {
        expect(pluginStore.subscribeEvent()).not.toBeUndefined();
      });

      test("the return value is callable", () => {
        const subChain = pluginStore.subscribeEvent();
        expect(() => subChain("topicId", "payload")).not.toThrow();
      });
    });

    describe("runPluginForEvent", () => {
      describe("onCreateSubscribe", () => {
        test("should not throw", () => {
          expect(() =>
            pluginStore.onCreateSubscribeEvent("topicId"),
          ).not.toThrow();
        });
      });

      describe("onCreateUnsubscribe", () => {
        test("should not throw", () => {
          expect(() =>
            pluginStore.onCreateSubscribeEvent("topicId"),
          ).not.toThrow();
        });
      });

      describe("onCreatePublish", () => {
        test("should not throw", () => {
          expect(() =>
            pluginStore.onCreatePublishEvent("topicId", "payload"),
          ).not.toThrow();
        });
      });

      describe("onUnregisterAllTopics", () => {
        test("should not throw", () => {
          expect(() => pluginStore.onUnregisterAllTopicsEvent()).not.toThrow();
        });
      });
    });
  });

  describe("when there are plugins", () => {
    describe("runPluginForEvent", () => {
      let plugin1: Plugin;
      let plugin2: Plugin;
      let pluginStore: PluginStore;

      beforeEach(() => {
        pluginStore = new PluginStore();
        plugin1 = {
          onCreateSubscribe: vi.fn(),
          onCreateUnsubscribe: vi.fn(),
          onUnregisterAllTopics: vi.fn(),
        };
        plugin2 = {
          onCreateSubscribe: vi.fn(),
          onCreatePublish: vi.fn(),
        };
        pluginStore.addPlugin(plugin1);
        pluginStore.addPlugin(plugin2);
      });

      afterEach(() => {
        vi.restoreAllMocks();
      });

      test("onCreateSubscribe", () => {
        pluginStore.onCreateSubscribeEvent("topicId");

        // plugin1
        expect(plugin1.onCreateSubscribe).toHaveBeenCalledWith("topicId");
        expect(plugin1.onCreateUnsubscribe).not.toHaveBeenCalled();
        expect(plugin1.onUnregisterAllTopics).not.toHaveBeenCalled();

        // plugin2
        expect(plugin2.onCreateSubscribe).toHaveBeenCalledWith("topicId");
        expect(plugin2.onCreatePublish).not.toHaveBeenCalled();
      });

      test("onCreateUnsubscribe", () => {
        pluginStore.onCreateUnsubscribeEvent("topicId");

        // plugin1
        expect(plugin1.onCreateSubscribe).not.toHaveBeenCalled();
        expect(plugin1.onCreateUnsubscribe).toHaveBeenCalledWith("topicId");
        expect(plugin1.onUnregisterAllTopics).not.toHaveBeenCalled();

        // plugin2
        expect(plugin2.onCreateSubscribe).not.toHaveBeenCalled();
        expect(plugin2.onCreatePublish).not.toHaveBeenCalled();
      });

      test("onCreatePublish", () => {
        pluginStore.onCreatePublishEvent("topicId", "payload");

        // plugin1
        expect(plugin1.onCreateSubscribe).not.toHaveBeenCalled();
        expect(plugin1.onCreateUnsubscribe).not.toHaveBeenCalled();
        expect(plugin1.onUnregisterAllTopics).not.toHaveBeenCalled();

        // plugin2
        expect(plugin2.onCreateSubscribe).not.toHaveBeenCalled();
        expect(plugin2.onCreatePublish).toHaveBeenCalledWith(
          "topicId",
          "payload",
        );
      });

      test("onUnregisterAllTopics", () => {
        pluginStore.onUnregisterAllTopicsEvent();

        // plugin1
        expect(plugin1.onCreateSubscribe).not.toHaveBeenCalled();
        expect(plugin1.onCreateUnsubscribe).not.toHaveBeenCalled();
        expect(plugin1.onUnregisterAllTopics).toHaveBeenCalled();

        // plugin2
        expect(plugin2.onCreateSubscribe).not.toHaveBeenCalled();
        expect(plugin2.onCreatePublish).not.toHaveBeenCalled();
      });
    });
  });
});
