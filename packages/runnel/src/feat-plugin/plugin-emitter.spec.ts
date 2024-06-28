import type { JsonSchema, Plugin, TopicId } from "../primitive-types";
import type { RunnelGlobals } from "../scope";
import { mapPlugins } from "./map-plugins";
import { createPluginEmitter } from "./plugin-emitter";
import { createGetSynchedPluginStores } from "./sync-plugins";

describe("plugin-emitter", () => {
  describe("emitPlugins", () => {
    describe("When no plugins are set", () => {
      let pluginStoreMap: ReturnType<typeof mapPlugins>;
      let emitter: ReturnType<typeof createPluginEmitter>;
      let pluginMap = new Map<any, Plugin[]>();
      const scope = {} as RunnelGlobals;

      beforeEach(() => {
        pluginStoreMap = mapPlugins(pluginMap);
        emitter = createPluginEmitter(
          createGetSynchedPluginStores(pluginStoreMap, scope),
          scope,
        );
      });

      afterEach(() => {
        scope.pluginScopes = undefined;
      });

      test("should not throw", () => {
        expect(() => emitter.publish("topicId", "payload")).not.toThrow();
        expect(() => emitter.subscribe("topicId", "payload")).not.toThrow();
        expect(() =>
          emitter.onCreatePublish("topicId", "payload"),
        ).not.toThrow();
        expect(() => emitter.onCreateSubscribe("topicId")).not.toThrow();
        expect(() => emitter.onCreateUnsubscribe("topicId")).not.toThrow();
        expect(() => emitter.onUnregisterAllTopics()).not.toThrow();
      });
    });

    describe("When plugins are set", () => {
      let pluginStoreMap: ReturnType<typeof mapPlugins>;
      let schemaStore: Map<TopicId, JsonSchema>;
      let emitter: ReturnType<typeof createPluginEmitter>;
      const scope = {} as RunnelGlobals;
      let mock1stBatchLocal1: ReturnType<typeof vi.fn>;
      let mock1stBatchGlobal: ReturnType<typeof vi.fn>;
      let mock1stBatchLocal2: ReturnType<typeof vi.fn>;
      let mock2ndBatchGlobal1: ReturnType<typeof vi.fn>;
      let mock2ndBatchGlobal2: ReturnType<typeof vi.fn>;

      beforeEach(() => {
        mock1stBatchLocal1 = vi.fn();
        mock1stBatchGlobal = vi.fn();
        mock1stBatchLocal2 = vi.fn();
        mock2ndBatchGlobal1 = vi.fn();
        mock2ndBatchGlobal2 = vi.fn();

        schemaStore = new Map();
        const pluginMap1stBatch = new Map<any, Plugin[]>()
          .set(undefined, [
            {
              onCreatePublish: (topicId, payload) => {
                mock1stBatchLocal1(topicId, payload);
              },
            },
            {
              subscribe: (topicId: TopicId, payload: unknown) => {
                mock1stBatchLocal2(topicId, payload);
                return payload + " + mock1stBatchLocal2 has been called";
              },
            },
          ]) // Local scope
          .set(scope, [
            {
              onCreatePublish: mock1stBatchGlobal,
              publish: (topicId: TopicId, payload: unknown) => {
                mock2ndBatchGlobal2(topicId, payload);
                return payload;
              },
            },
          ]); // Global scope
        pluginStoreMap = mapPlugins(pluginMap1stBatch);
        emitter = createPluginEmitter(
          createGetSynchedPluginStores(pluginStoreMap, scope),
          scope,
        );
        schemaStore.set("topicId", { some: "schema" });

        // Adding another set of plugins to the same global scope.
        const pluginMap2ndBatch = new Map<any, Plugin[]>().set(scope, [
          {
            onCreatePublish: mock2ndBatchGlobal1,
          },
        ]);
        mapPlugins(pluginMap2ndBatch);

        // Call emitter after the 2nd batch is added. So we can test if the 2nd batch is acknowledged by emitter.
        emitter.onCreatePublish("topicId", "payload");
        emitter.publish("topicId", "payload");
        emitter.subscribe("topicId", "payload");
      });

      afterEach(() => {
        schemaStore.clear();
        scope.pluginScopes = undefined;
        vi.restoreAllMocks();
      });

      test("should run a method of local/global plugins", () => {
        expect(mock1stBatchLocal1).toHaveBeenCalledTimes(1);
        expect(mock1stBatchLocal1).toHaveBeenCalledWith("topicId", "payload");

        expect(mock1stBatchGlobal).toHaveBeenCalledTimes(1);
        expect(mock1stBatchGlobal).toHaveBeenCalledWith("topicId", "payload");

        expect(mock1stBatchLocal2).toHaveBeenCalledTimes(1);
        expect(mock1stBatchLocal2).toHaveBeenCalledWith("topicId", "payload");

        // Additional plugin gets called.
        expect(mock2ndBatchGlobal1).toHaveBeenCalledTimes(1);
        expect(mock2ndBatchGlobal1).toHaveBeenCalledWith("topicId", "payload");

        expect(mock2ndBatchGlobal2).toHaveBeenCalledTimes(1);
        expect(mock2ndBatchGlobal2).toHaveBeenCalledWith("topicId", "payload");
      });
    });
  });
});
