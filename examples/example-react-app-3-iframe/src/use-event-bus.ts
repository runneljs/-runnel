import deepEqual from "deep-equal";
import createEventBus from "mfe-event-bus";
import {
  createPlugin,
  type Metrics as MetricsType,
} from "mfe-event-bus-metric-plugin";
import { validator } from "mfe-event-bus-validator";
import { useEffect, useMemo, useState } from "react";

const { plugin: metricPlugin, observer: metricObserver } =
  createPlugin(deepEqual);
const eventBus = createEventBus({
  deepEqual,
  payloadValidator: validator,
  scope: window.parent, // Use the parent window as the space.
  plugins: [[window.parent, [metricPlugin]]], // When you want to observe the parent window. If the `scope` is smaller than the specified plugin scope, the specified plugin will not work.
  // plugins: [metricPlugin], // When you want to observe the current event bus only.
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
    version?: string;
  },
) {
  return useMemo(
    () => eventBus.registerTopic<T>(topicName, jsonSchema, options),
    [],
  );
}

export { useEventBus, useEventBusMetrics, type MetricsType };
