import { afterEach, beforeEach, describe, expect, jest, test } from "bun:test";
import { PluginStore } from "./PluginStore";
import type { Plugin } from "./primitive-types";

describe("PluginStore", () => {
  describe("when there are no plugins", () => {
    let pluginStore: PluginStore;
    let schemeStore: Map<string, object>;

    beforeEach(() => {
      schemeStore = new Map();
      pluginStore = new PluginStore(schemeStore);
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
      let schemaStore: Map<string, object>;
      let pluginStore: PluginStore;

      beforeEach(() => {
        schemaStore = new Map();
        schemaStore.set("topicId", {});
        pluginStore = new PluginStore(schemaStore);
        plugin1 = {
          onCreateSubscribe: jest.fn(),
          onCreateUnsubscribe: jest.fn(),
          onUnregisterAllTopics: jest.fn(),
        };
        plugin2 = {
          onCreateSubscribe: jest.fn(),
          onCreatePublish: jest.fn(),
        };
        pluginStore.addPlugin(plugin1);
        pluginStore.addPlugin(plugin2);
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      test("onCreateSubscribe", () => {
        pluginStore.onCreateSubscribeEvent("topicId");

        // plugin1
        expect(plugin1.onCreateSubscribe).toHaveBeenCalledWith(
          "topicId",
          schemaStore.get("topicId"),
        );
        expect(plugin1.onCreateUnsubscribe).not.toHaveBeenCalled();
        expect(plugin1.onUnregisterAllTopics).not.toHaveBeenCalled();

        // plugin2
        expect(plugin2.onCreateSubscribe).toHaveBeenCalledWith(
          "topicId",
          schemaStore.get("topicId"),
        );
        expect(plugin2.onCreatePublish).not.toHaveBeenCalled();
      });

      test("onCreateUnsubscribe", () => {
        pluginStore.onCreateUnsubscribeEvent("topicId");

        // plugin1
        expect(plugin1.onCreateSubscribe).not.toHaveBeenCalled();
        expect(plugin1.onCreateUnsubscribe).toHaveBeenCalledWith(
          "topicId",
          schemaStore.get("topicId"),
        );
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
          schemaStore.get("topicId"),
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
