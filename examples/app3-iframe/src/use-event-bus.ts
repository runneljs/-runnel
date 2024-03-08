import {
  createPlugin,
  type Metrics as MetricsType,
} from "@runnel/metric-plugin";
import { validator } from "@runnel/validator";
import deepEqual from "deep-equal";
import { useEffect, useMemo, useState } from "react";
import { createEventBus } from "runneljs";

const { plugin: metricPlugin, observer: metricObserver } =
  createPlugin(deepEqual);
const eventBus = createEventBus({
  deepEqual,
  payloadValidator: validator,
  scope: window.parent, // Use the parent window as the space.
  pluginMap: new Map([[window.parent, [metricPlugin]]]), // When you want to observe the parent window. If the `scope` is smaller than the specified plugin scope, the specified plugin will not work.
  // pluginMap: new Map([[undefined, [plugin]]]), // When you want to observe the current event bus only.
});

function useEventBusMetrics() {
  const [metrics, setMetrics] = useState<MetricsType>({});
  useEffect(() => {
    // Enforce rerender on the nested object's change.
    const updateNestedState = (newMetrics: MetricsType) => {
      setMetrics((prevMetrics) => {
        return { ...prevMetrics, ...newMetrics };
      });
    };
    metricObserver.subscribe(updateNestedState);
    return () => metricObserver.unsubscribe(updateNestedState);
  }, []);
  return { metrics };
}

function useEventBus<T>(
  topicName: string,
  jsonSchema: object,
  options?: {
    version?: number;
  },
) {
  return useMemo(
    () => eventBus.registerTopic<T>(topicName, jsonSchema, options),
    [],
  );
}

export { useEventBus, useEventBusMetrics, type MetricsType };
