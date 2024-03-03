import { afterEach, beforeEach, describe, expect, jest, test } from "bun:test";
import { PluginStore } from "./PluginStore";
import { SubscriptionStore } from "./SubscriptionStore";
import type { Plugin } from "./primitive-types";

describe("PluginStore", () => {
  describe("runAllPluginsForEvent", () => {
    let plugin1: Plugin;
    let plugin2: Plugin;
    let subscriptionStore: SubscriptionStore;
    let pluginStore: PluginStore;

    beforeEach(() => {
      subscriptionStore = new SubscriptionStore();
      const cbToSubscribe = () => {};
      subscriptionStore.set("topicId", new Map().set("uuid", cbToSubscribe));
      pluginStore = new PluginStore(subscriptionStore);
      plugin1 = {
        onSubscribe: jest.fn(),
        onUnregisterAllTopics: jest.fn(),
      };
      plugin2 = {
        onSubscribe: jest.fn(),
        onPublish: jest.fn(),
      };
      pluginStore.addPlugin(plugin1);
      pluginStore.addPlugin(plugin2);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test("onSubscribe", () => {
      pluginStore.runAllPluginsForEvent("onSubscribe", "topicId", "payload");
      expect(plugin1.onSubscribe).toHaveBeenCalledWith(
        "topicId",
        subscriptionStore.get("topicId"),
      );
      expect(plugin1.onUnregisterAllTopics).not.toHaveBeenCalled();

      expect(plugin2.onSubscribe).toHaveBeenCalledWith(
        "topicId",
        subscriptionStore.get("topicId"),
      );
      expect(plugin2.onPublish).not.toHaveBeenCalled();
    });

    test("onPublish", () => {
      pluginStore.runAllPluginsForEvent("onPublish", "topicId", "payload");
      expect(plugin1.onSubscribe).not.toHaveBeenCalled();
      expect(plugin1.onUnregisterAllTopics).not.toHaveBeenCalled();

      expect(plugin2.onSubscribe).not.toHaveBeenCalled();
      expect(plugin2.onPublish).toHaveBeenCalledWith(
        "topicId",
        subscriptionStore.get("topicId"),
        "payload",
      );
    });

    test("onUnregisterAllTopics", () => {
      pluginStore.runAllPluginsForEvent("onUnregisterAllTopics");
      expect(plugin1.onSubscribe).not.toHaveBeenCalled();
      expect(plugin1.onUnregisterAllTopics).toHaveBeenCalled();

      expect(plugin2.onSubscribe).not.toHaveBeenCalled();
      expect(plugin2.onPublish).not.toHaveBeenCalled();
    });
  });
});
