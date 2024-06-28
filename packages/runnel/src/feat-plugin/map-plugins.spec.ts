import type { Plugin, PluginScope } from "../primitive-types";
import { mapPlugins } from "./map-plugins";
import { PluginStore } from "./PluginStore";

describe("mapPlugins", () => {
  let globalScope: any;

  beforeAll(() => {
    globalScope = {};
  });

  describe("When no plugins are set", () => {
    let pluginStoreMap: Map<any, PluginStore>;

    beforeEach(() => {
      pluginStoreMap = mapPlugins(new Map<PluginScope, Plugin[]>());
    });

    test("should return an empty pluginStoreMap", () => {
      expect(pluginStoreMap.size).toBe(0);
    });
  });

  describe("When local plugins are set", () => {
    let pluginStoreMap: Map<any, PluginStore>;

    beforeEach(() => {
      const pluginMap = new Map<PluginScope, Plugin[]>().set(undefined, [
        createNewPlugin(),
        createNewPlugin(),
      ]);
      pluginStoreMap = mapPlugins(pluginMap);
    });

    test("should map local plugins to pluginStoreMap", () => {
      expect(pluginStoreMap.size).toBe(1);
      expect(pluginStoreMap.get(undefined) instanceof PluginStore).toBeTruthy();
      expect(pluginStoreMap.get(undefined)!.size()).toBe(2);
      expect(pluginStoreMap.get(globalScope)).toBeUndefined();
    });
  });

  describe("When global plugins are set", () => {
    let pluginStoreMap: Map<any, PluginStore>;

    beforeEach(() => {
      const pluginMap = new Map().set(globalScope, [
        createNewPlugin(),
        createNewPlugin(),
      ]);
      pluginStoreMap = mapPlugins(pluginMap);
    });

    afterEach(() => {
      pluginStoreMap.clear();
      globalScope.pluginStore = undefined;
    });

    test("should map global plugins to pluginStoreMap", () => {
      expect(pluginStoreMap.size).toBe(1);
      expect(
        pluginStoreMap.get(globalScope) instanceof PluginStore,
      ).toBeTruthy();
      expect(pluginStoreMap.get(globalScope)!.size()).toBe(2);
      expect(globalScope.pluginStore.size()).toBe(2);
      expect(pluginStoreMap.get(undefined)).toBeUndefined();
    });
  });

  describe("When both local and global plugins are set", () => {
    let pluginStoreMap: Map<any, PluginStore>;

    beforeEach(() => {
      const pluginMap = new Map()
        .set(undefined, [
          createNewPlugin(),
          createNewPlugin(),
          createNewPlugin(),
        ])
        .set(globalScope, [
          createNewPlugin(),
          createNewPlugin(),
          createNewPlugin(),
          createNewPlugin(),
        ]);
      pluginStoreMap = mapPlugins(pluginMap);
    });

    afterEach(() => {
      pluginStoreMap.clear();
      globalScope.pluginStore = undefined;
    });

    test("should map local and global plugins to pluginStoreMap", () => {
      expect(pluginStoreMap.size).toBe(2);
      expect(pluginStoreMap.get(undefined) instanceof PluginStore).toBeTruthy();
      expect(pluginStoreMap.get(undefined)!.size()).toBe(3);
      expect(
        pluginStoreMap.get(globalScope) instanceof PluginStore,
      ).toBeTruthy();
      expect(pluginStoreMap.get(globalScope)!.size()).toBe(4);
      expect(globalScope.pluginStore.size()).toBe(4);
    });
  });

  describe('When pluginScope is not local ("undefined") or global ("globalScope")', () => {
    let pluginStoreMap: Map<any, PluginStore>;
    const pluginScope = {} as any;
    beforeEach(() => {
      const pluginMap = new Map().set(pluginScope, [
        createNewPlugin(),
        createNewPlugin(),
      ]);
      pluginStoreMap = mapPlugins(pluginMap);
    });

    afterEach(() => {
      pluginStoreMap.clear();
      pluginScope.pluginStore = undefined;
    });

    test("should map local plugins to pluginStoreMap", () => {
      expect(pluginStoreMap.size).toBe(1);
      expect(pluginStoreMap.get(undefined)).toBeUndefined();
      expect(pluginStoreMap.get(globalScope)).toBeUndefined();
      expect(
        pluginStoreMap.get(pluginScope) instanceof PluginStore,
      ).toBeTruthy();
      expect(pluginStoreMap.get(pluginScope)!.size()).toBe(2);
    });
  });

  describe("when another set of plugins are added to the global scope", () => {
    let pluginStoreMap: Map<any, PluginStore>;
    const scope = {} as any;

    beforeEach(() => {
      const pluginMap = new Map<PluginScope, Plugin[]>().set(scope, [
        createNewPlugin(),
      ]);
      pluginStoreMap = mapPlugins(pluginMap);
    });

    afterEach(() => {
      pluginStoreMap.clear();
      scope.pluginStore = undefined;
    });

    describe("add another set of plugins", () => {
      let anotherPluginStoreMap: Map<any, PluginStore>;

      beforeEach(() => {
        const anotherPluginMap = new Map().set(scope, [
          createNewPlugin(),
          createNewPlugin(),
        ]);
        anotherPluginStoreMap = mapPlugins(anotherPluginMap);
      });

      afterEach(() => {
        anotherPluginStoreMap.clear();
        scope.pluginStore = undefined;
      });

      test("pluginStores that share the same scope have the same number of plugins", () => {
        expect(anotherPluginStoreMap.size).toBe(1);
        expect(
          anotherPluginStoreMap.get(scope) instanceof PluginStore,
        ).toBeTruthy();
        expect(anotherPluginStoreMap.get(scope)!.size()).toBe(3);
        expect(scope.pluginStore.size()).toBe(3);
        expect(pluginStoreMap.get(scope)!.size()).toBe(3);
      });
    });
  });
});

function createNewPlugin(): Plugin {
  return { onCreatePublish: () => {} };
}
