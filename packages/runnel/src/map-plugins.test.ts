import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";
import { PluginStore } from "./PluginStore";
import { mapPlugins } from "./map-plugins";
import type { Plugin } from "./primitive-types";

describe("mapPlugins", () => {
  let globalScope: any;
  let schemaStore: Map<string, object>;

  beforeAll(() => {
    globalScope = {};
  });

  beforeEach(() => {
    schemaStore = new Map();
  });

  describe("When no plugins are set", () => {
    let pluginStoreMap: Map<any, PluginStore>;

    beforeEach(() => {
      pluginStoreMap = mapPlugins(schemaStore, new Map());
    });

    // Regardless of the schema, it should return the consistent result.
    describe("When no schemas are set", () => {
      test("should return an empty pluginStoreMap", () => {
        expect(pluginStoreMap.size).toBe(0);
      });
    });

    describe("When schemas are set", () => {
      beforeEach(() => {
        schemaStore = new Map();
        schemaStore.set("topicId", {});
      });

      test("should return an empty pluginStoreMap", () => {
        expect(pluginStoreMap.size).toBe(0);
      });
    });
  });

  describe("When local plugins are set", () => {
    let pluginStoreMap: Map<any, PluginStore>;

    beforeEach(() => {
      const pluginMap = new Map().set(undefined, [
        createNewPlugin(),
        createNewPlugin(),
      ]);
      pluginStoreMap = mapPlugins(schemaStore, pluginMap);
    });

    // Regardless of the schema, it should return the consistent result.
    describe("When no schemas are set", () => {
      test("should map local plugins to pluginStoreMap", () => {
        expect(pluginStoreMap.size).toBe(1);
        expect(pluginStoreMap.get(undefined) instanceof PluginStore).toBeTrue();
        expect(pluginStoreMap.get(undefined)!.size()).toBe(2);
        expect(pluginStoreMap.get(globalScope)).toBeUndefined();
      });
    });

    describe("When schemas are set", () => {
      beforeEach(() => {
        schemaStore = new Map();
        schemaStore.set("topicId", {});
      });

      test("should map local plugins to pluginStoreMap", () => {
        expect(pluginStoreMap.size).toBe(1);
        expect(pluginStoreMap.get(undefined) instanceof PluginStore).toBeTrue();
        expect(pluginStoreMap.get(undefined)!.size()).toBe(2);
        expect(pluginStoreMap.get(globalScope)).toBeUndefined();
      });
    });
  });

  describe("When global plugins are set", () => {
    let pluginStoreMap: Map<any, PluginStore>;

    beforeEach(() => {
      const pluginMap = new Map().set(globalScope, [
        createNewPlugin(),
        createNewPlugin(),
      ]);
      pluginStoreMap = mapPlugins(schemaStore, pluginMap);
    });

    afterEach(() => {
      pluginStoreMap.clear();
      globalScope.runnelPluginStore = undefined;
    });

    // Regardless of the schema, it should return the consistent result.
    describe("When no schemas are set", () => {
      test("should map global plugins to pluginStoreMap", () => {
        expect(pluginStoreMap.size).toBe(1);
        expect(
          pluginStoreMap.get(globalScope) instanceof PluginStore,
        ).toBeTrue();
        expect(pluginStoreMap.get(globalScope)!.size()).toBe(2);
        expect(globalScope.runnelPluginStore.size()).toBe(2);
        expect(pluginStoreMap.get(undefined)).toBeUndefined();
      });
    });

    describe("When schemas are set", () => {
      beforeEach(() => {
        schemaStore = new Map();
        schemaStore.set("topicId", {});
      });

      test("should map global plugins to pluginStoreMap", () => {
        expect(pluginStoreMap.size).toBe(1);
        expect(
          pluginStoreMap.get(globalScope) instanceof PluginStore,
        ).toBeTrue();
        expect(pluginStoreMap.get(globalScope)!.size()).toBe(2);
        expect(globalScope.runnelPluginStore.size()).toBe(2);
        expect(pluginStoreMap.get(undefined)).toBeUndefined();
      });
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
      pluginStoreMap = mapPlugins(schemaStore, pluginMap);
    });

    afterEach(() => {
      pluginStoreMap.clear();
      globalScope.runnelPluginStore = undefined;
    });

    // Regardless of the schema, it should return the consistent result.
    describe("When no schemas are set", () => {
      test("should map local and global plugins to pluginStoreMap", () => {
        expect(pluginStoreMap.size).toBe(2);
        expect(pluginStoreMap.get(undefined) instanceof PluginStore).toBeTrue();
        expect(pluginStoreMap.get(undefined)!.size()).toBe(3);
        expect(
          pluginStoreMap.get(globalScope) instanceof PluginStore,
        ).toBeTrue();
        expect(pluginStoreMap.get(globalScope)!.size()).toBe(4);
        expect(globalScope.runnelPluginStore.size()).toBe(4);
      });
    });

    describe("When schemas are set", () => {
      beforeEach(() => {
        schemaStore = new Map();
        schemaStore.set("topicId", {});
      });

      test("should map local and global plugins to pluginStoreMap", () => {
        expect(pluginStoreMap.size).toBe(2);
        expect(pluginStoreMap.get(undefined) instanceof PluginStore).toBeTrue();
        expect(pluginStoreMap.get(undefined)!.size()).toBe(3);
        expect(
          pluginStoreMap.get(globalScope) instanceof PluginStore,
        ).toBeTrue();
        expect(pluginStoreMap.get(globalScope)!.size()).toBe(4);
        expect(globalScope.runnelPluginStore.size()).toBe(4);
      });
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
      pluginStoreMap = mapPlugins(schemaStore, pluginMap);
    });

    afterEach(() => {
      pluginStoreMap.clear();
      pluginScope.runnelPluginStore = undefined;
    });

    // Regardless of the schema, it should return the consistent result.
    describe("When no schemas are set", () => {
      test("should map local plugins to pluginStoreMap", () => {
        expect(pluginStoreMap.size).toBe(1);
        expect(pluginStoreMap.get(undefined)).toBeUndefined();
        expect(pluginStoreMap.get(globalScope)).toBeUndefined();
        expect(
          pluginStoreMap.get(pluginScope) instanceof PluginStore,
        ).toBeTrue();
        expect(pluginStoreMap.get(pluginScope)!.size()).toBe(2);
      });
    });

    describe("When schemas are set", () => {
      beforeEach(() => {
        schemaStore = new Map();
        schemaStore.set("topicId", {});
      });

      test("should map local plugins to pluginStoreMap", () => {
        expect(pluginStoreMap.size).toBe(1);
        expect(pluginStoreMap.get(undefined)).toBeUndefined();
        expect(pluginStoreMap.get(globalScope)).toBeUndefined();
        expect(
          pluginStoreMap.get(pluginScope) instanceof PluginStore,
        ).toBeTrue();
        expect(pluginStoreMap.get(pluginScope)!.size()).toBe(2);
      });
    });
  });

  describe("when another set of plugins are added to the global scope", () => {
    let pluginStoreMap: Map<any, PluginStore>;
    const scope = {} as any;

    beforeEach(() => {
      const pluginMap = new Map().set(scope, [createNewPlugin()]);
      pluginStoreMap = mapPlugins(schemaStore, pluginMap);
    });

    afterEach(() => {
      pluginStoreMap.clear();
      scope.runnelPluginStore = undefined;
    });

    describe("add another set of plugins", () => {
      let anotherPluginStoreMap: Map<any, PluginStore>;

      beforeEach(() => {
        const anotherPluginMap = new Map().set(scope, [
          createNewPlugin(),
          createNewPlugin(),
        ]);
        anotherPluginStoreMap = mapPlugins(schemaStore, anotherPluginMap);
      });

      afterEach(() => {
        anotherPluginStoreMap.clear();
        scope.runnelPluginStore = undefined;
      });

      test("pluginStores that share the same scope have the same number of plugins", () => {
        expect(anotherPluginStoreMap.size).toBe(1);
        expect(
          anotherPluginStoreMap.get(scope) instanceof PluginStore,
        ).toBeTrue();
        expect(anotherPluginStoreMap.get(scope)!.size()).toBe(3);
        expect(scope.runnelPluginStore.size()).toBe(3);
        expect(pluginStoreMap.get(scope)!.size()).toBe(3);
      });
    });
  });
});

function createNewPlugin(): Plugin {
  return { onCreatePublish: () => {} };
}
