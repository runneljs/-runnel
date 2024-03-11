import { afterEach, beforeEach, describe, expect, jest, test } from "bun:test";
import { mapPlugins } from "./map-plugins";
import { createPluginEmitter } from "./plugin-emitter";
import type { JsonSchema, Plugin, TopicId } from "./primitive-types";

describe("plugin-emitter", () => {
  describe("emitPlugins", () => {
    describe("When no plugins are set", () => {
      let pluginStoreMap: ReturnType<typeof mapPlugins>;
      let schemaStore: Map<TopicId, JsonSchema>;
      let emitter: ReturnType<typeof createPluginEmitter>;
      let pluginMap = new Map<any, Plugin[]>();
      const scope = {} as any;

      beforeEach(() => {
        schemaStore = new Map();
        pluginStoreMap = mapPlugins(schemaStore, pluginMap);
        emitter = createPluginEmitter(pluginStoreMap, scope);
      });

      afterEach(() => {
        schemaStore.clear();
        scope.runnelPluginScopes = undefined;
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
      const scope = {} as any;
      let mock1stBatchLocal1: jest.Mock;
      let mock1stBatchGlobal: jest.Mock;
      let mock1stBatchLocal2: jest.Mock;
      let mock2ndBatchGlobal: jest.Mock;

      beforeEach(() => {
        mock1stBatchLocal1 = jest.fn();
        mock1stBatchGlobal = jest.fn();
        mock1stBatchLocal2 = jest.fn();
        mock2ndBatchGlobal = jest.fn();

        schemaStore = new Map();
        const pluginMap1stBatch = new Map<any, Plugin[]>()
          .set(undefined, [
            {
              onCreatePublish: (topicId, schema, payload) => {
                mock1stBatchLocal1(topicId, schema, payload);
              },
            },
            {
              subscribe: (topicId: TopicId, payload: unknown) => {
                mock1stBatchLocal2(topicId, payload);
                return payload + " + mock1stBatchLocal2 has been called";
              },
            },
          ]) // Local scope
          .set(scope, [{ onCreatePublish: mock1stBatchGlobal }]); // Global scope
        pluginStoreMap = mapPlugins(schemaStore, pluginMap1stBatch);
        emitter = createPluginEmitter(pluginStoreMap, scope);
        schemaStore.set("topicId", { some: "schema" });

        // Adding another set of plugins to the same global scope.
        const pluginMap2ndBatch = new Map<any, Plugin[]>().set(scope, [
          {
            onCreatePublish: mock2ndBatchGlobal,
          },
        ]);
        mapPlugins(schemaStore, pluginMap2ndBatch);

        // Call emitter after the 2nd batch is added. So we can test if the 2nd batch is acknowledged by emitter.
        emitter.onCreatePublish("topicId", "payload");
        emitter.subscribe("topicId", "payload");
      });

      afterEach(() => {
        schemaStore.clear();
        scope.runnelPluginScopes = undefined;
        jest.restoreAllMocks();
      });

      test("should run a method of local/global plugins", () => {
        expect(scope.runnelPluginStore.size()).toBe(2); // The 2nd batch is acknowledged.
        expect(mock1stBatchLocal1).toHaveBeenCalledTimes(1);
        expect(mock1stBatchLocal1).toHaveBeenCalledWith(
          "topicId",
          { some: "schema" },
          "payload",
        );

        expect(mock1stBatchGlobal).toHaveBeenCalledTimes(1);
        expect(mock1stBatchGlobal).toHaveBeenCalledWith(
          "topicId",
          { some: "schema" },
          "payload",
        );

        expect(mock1stBatchLocal2).toHaveBeenCalledTimes(1);
        expect(mock1stBatchLocal2).toHaveBeenCalledWith("topicId", "payload");

        // Additional plugin gets called.
        expect(mock2ndBatchGlobal).toHaveBeenCalledTimes(1);
        expect(mock2ndBatchGlobal).toHaveBeenCalledWith(
          "topicId",
          { some: "schema" },
          "payload",
        );
      });
    });
  });
});
