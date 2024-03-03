import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";
import { PluginStore } from "./PluginStore";
import { SubscriptionStore } from "./SubscriptionStore";
import { mapPlugins } from "./map-plugins";

describe("mapPlugins", () => {
  let globalScope: any;
  let subscriptionStore: SubscriptionStore;

  beforeAll(() => {
    globalScope = {};
  });

  beforeEach(() => {
    subscriptionStore = new SubscriptionStore();
  });

  describe("Set local plugins", () => {
    let pluginStoreMap: Map<any, PluginStore>;

    beforeAll(() => {
      const pluginMap = new Map().set(undefined, [
        createNewPlugin(),
        createNewPlugin(),
      ]);
      pluginStoreMap = mapPlugins(subscriptionStore, pluginMap);
    });

    test("should map local plugins to pluginStoreMap", () => {
      expect(pluginStoreMap.size).toBe(1);
      expect(pluginStoreMap.get(undefined)).toBeDefined();
      expect(pluginStoreMap.get(undefined) instanceof PluginStore).toBeTrue();
      expect(pluginStoreMap.get(undefined)!.size()).toBe(2);
      expect(pluginStoreMap.get(globalScope)).toBeUndefined();
    });

    describe("Set more local plugins", () => {
      beforeAll(() => {
        const pluginMap = new Map().set(undefined, [createNewPlugin()]);
        mapPlugins(subscriptionStore, pluginMap);
      });

      test("should not add more local plugins to pluginStoreMap", () => {
        expect(pluginStoreMap.size).toBe(1);
      });
    });
  });

  describe("Set global plugins", () => {
    let pluginStoreMap: Map<any, PluginStore>;

    beforeAll(() => {
      const pluginMap = new Map().set(globalScope, [
        createNewPlugin(),
        createNewPlugin(),
      ]);
      pluginStoreMap = mapPlugins(subscriptionStore, pluginMap);
    });

    afterAll(() => {
      pluginStoreMap.clear();
      globalScope.mfeEventBusPluginStore = undefined;
    });

    test("should map local plugins to pluginStoreMap", () => {
      expect(pluginStoreMap.size).toBe(1);
      expect(pluginStoreMap.get(globalScope)).toBeDefined();
      expect(pluginStoreMap.get(globalScope) instanceof PluginStore).toBeTrue();
      expect(pluginStoreMap.get(globalScope)!.size()).toBe(2);
      expect(pluginStoreMap.get(undefined)).toBeUndefined();
      // Set more local plugins
      const pluginMap = new Map().set(globalScope, [createNewPlugin()]);
      mapPlugins(subscriptionStore, pluginMap);
      expect(pluginStoreMap.size).toBe(1); // Only for globalScope1
      expect(pluginStoreMap.get(globalScope)!.size()).toBe(3);
    });
  });
});

function createNewPlugin() {
  return { onPublish: () => {} };
}
