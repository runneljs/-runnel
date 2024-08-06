import {
  createPlugin,
  type Metrics as MetricsType,
} from "@runnel/metric-plugin";
import { validator } from "@runnel/validator";
import deepEqual from "deep-equal";
import { useEffect, useMemo, useState } from "react";
import { runnel } from "runneljs";

const { register, observer: metricObserver } = createPlugin(deepEqual);
const eventBus = runnel("event-bus", deepEqual, validator);
register();

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
  return useMemo(() => {
    return eventBus.registerTopic<T>(topicName, jsonSchema, options);
  }, []);
}

export { useEventBus, useEventBusMetrics, type MetricsType };
