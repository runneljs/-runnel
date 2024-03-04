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
        onCreateSubscribe: jest.fn(),
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
      pluginStore.runPluginForEvent("onCreateSubscribe", "topicId", "payload");
      expect(plugin1.onCreateSubscribe).toHaveBeenCalledWith(
        "topicId",
        subscriptionStore.get("topicId"),
      );
      expect(plugin1.onUnregisterAllTopics).not.toHaveBeenCalled();

      expect(plugin2.onCreateSubscribe).toHaveBeenCalledWith(
        "topicId",
        subscriptionStore.get("topicId"),
      );
      expect(plugin2.onCreatePublish).not.toHaveBeenCalled();
    });

    test("onCreatePublish", () => {
      pluginStore.runPluginForEvent("onCreatePublish", "topicId", "payload");
      expect(plugin1.onCreateSubscribe).not.toHaveBeenCalled();
      expect(plugin1.onUnregisterAllTopics).not.toHaveBeenCalled();

      expect(plugin2.onCreateSubscribe).not.toHaveBeenCalled();
      expect(plugin2.onCreatePublish).toHaveBeenCalledWith(
        "topicId",
        subscriptionStore.get("topicId"),
        "payload",
      );
    });

    test("onUnregisterAllTopics", () => {
      pluginStore.runPluginForEvent("onUnregisterAllTopics");
      expect(plugin1.onCreateSubscribe).not.toHaveBeenCalled();
      expect(plugin1.onUnregisterAllTopics).toHaveBeenCalled();

      expect(plugin2.onCreateSubscribe).not.toHaveBeenCalled();
      expect(plugin2.onCreatePublish).not.toHaveBeenCalled();
    });
  });
});
